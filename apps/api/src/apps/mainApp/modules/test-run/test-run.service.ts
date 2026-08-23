import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as moment from 'moment';
import { Browser, chromium, Page, Response } from 'playwright';

import { Run, RunStatus } from '../../../../shared/run.entity';
import { TestDefinition } from '../../../../shared/test-definition.entity';
import { TestStep } from '../../../../shared/test-step.entity';
import {
  ExecutionMode,
  StepStatus,
  TraceEvent,
} from '../../../../shared/trace-event.entity';
import { AgenticExecutionService } from '../agentic-execution/agentic-execution.service';
import { RunOptions } from '../execution/execution.dto';
import { PromotionCandidateService } from '../promotion-candidate/promotion-candidate.service';
import { RunService } from '../run/run.service';
import { TestStoreService } from '../test-store/test-store.service';
import { TraceEventService } from '../trace-event/trace-event.service';

export type TestRun = Run & { events: TraceEvent[] };

@Injectable()
export class TestRunService {
  private readonly logger = new Logger(TestRunService.name);

  constructor(
    private readonly runService: RunService,
    private readonly traceEventService: TraceEventService,
    private readonly testStoreService: TestStoreService,
    private readonly agenticExecutionService: AgenticExecutionService,
    private readonly promotionCandidateService: PromotionCandidateService,
  ) {}

  async getRun(runId: string) {
    const run = await this.runService.get(runId);
    const traceEventService =
      await this.traceEventService.getTraceEventsByRunId(runId);

    return { run: run, traceEvents: traceEventService };
  }

  async list() {
    const runs = await this.runService.list();
    const traceEvents = await this.traceEventService.list();

    const testRunList: TestRun[] = [];
    runs.map((r) => {
      const testRun = { ...r } as TestRun;

      const events: TraceEvent[] = traceEvents.filter(
        (v) => r.runId === v.runId,
      );
      testRun.events = events;

      testRunList.push(testRun);
    });

    return testRunList;
  }

  async runTest(testId: string, options: RunOptions = {}) {
    const testStore = await this.testStoreService.get(testId);

    if (!testStore.testDefinition) {
      throw new NotFoundException('Test not found');
    }
    this.logger.log(
      `Running test ${testId} with options: ${JSON.stringify(options)}`,
    );
    const testDefinition = testStore.testDefinition;

    const run = await this.runService.createRun(testId);
    this.logger.debug(`Inserted run ${JSON.stringify(run)}`);
    const runId: string = run.identifiers[0].runId;
    this.logger.log(`Starting run ${runId}...`);

    let browser: Browser | undefined;
    let overallStatus = 'running' as RunStatus;

    try {
      await this.runService.updateOverallStatusByRunId(runId, overallStatus);
      this.logger.log(`Run ${runId} status updated to running...`);
      this.logger.log(`Starting browser...`);
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage(); // ONE page, shared across deterministic + agentic steps

      this.logger.log(`Running test steps...`);
      // Run deterministic steps first
      for (const step of testStore.testSteps) {
        const shouldForceBreak = options.forceFailureAtStep === step.order;
        const stepToRun = shouldForceBreak ? this.corruptSelector(step) : step;
        this.logger.debug(
          `Should step ${stepToRun.order} force break? : ${shouldForceBreak}`,
        );

        const start = performance.now();
        try {
          this.logger.debug(
            `Running deterministic step ${stepToRun.order} on "${stepToRun.selector ?? stepToRun.value}"`,
          );
          const response = await this.executeDeterministicStep(
            page,
            stepToRun,
            testDefinition,
          );
          this.logger.debug(
            `Response from deterministic step ${stepToRun.order}: ${JSON.stringify(response)}`,
          );
          const end = performance.now();

          const insertedTraceEvent =
            await this.traceEventService.createTraceEvent({
              runId: runId,
              stepId: stepToRun.stepId,
              mode: ExecutionMode.DETERMINISTIC,
              status: StepStatus.PASSED,
              durationMs: end - start,
              actionTaken: `${stepToRun.action} on "${stepToRun.selector ?? stepToRun.value}"`,
              customerExplanation: `Step "${stepToRun.description}" completed as scripted.`,
            });
          this.logger.debug(
            `Inserted trace event ${JSON.stringify(insertedTraceEvent)}`,
          );
          overallStatus = RunStatus.PASSED;
        } catch (err) {
          // UI drift detected -> hand off to the agentic executor on the SAME page.
          const end = performance.now();
          const failureReason = (err as Error).message;
          this.logger.warn(
            `Step ${stepToRun.order} failed deterministically: ${failureReason}`,
          );

          const insertedTraceEvent =
            await this.traceEventService.createTraceEvent({
              runId: runId,
              stepId: stepToRun.stepId,
              mode: ExecutionMode.DETERMINISTIC,
              status: StepStatus.FAILED,
              durationMs: end - start,
              error: failureReason,
              customerExplanation: `Step "${stepToRun.description}" failed as scripted - handing off to agentic recovery.`,
            });
          this.logger.debug(
            `Inserted trace event ${JSON.stringify(insertedTraceEvent)}`,
          );

          const recoveryStart = performance.now();
          const recoveryResult = await this.agenticExecutionService.recoverStep(
            page,
            stepToRun,
            testDefinition,
            failureReason,
          );
          const recoveryEnd = performance.now();
          const recoveryInsertedTraceEvent =
            await this.traceEventService.createTraceEvent({
              runId: runId,
              stepId: stepToRun.stepId,
              mode: ExecutionMode.AGENTIC,
              status: recoveryResult.success
                ? StepStatus.RECOVERED
                : StepStatus.FAILED,
              durationMs: recoveryEnd - recoveryStart,
              actionTaken: recoveryResult.actionTaken,
              reasoning: recoveryResult.reasoning,
              customerExplanation: recoveryResult.success
                ? `The agent recovered from the UI change: ${recoveryResult.reasoning}`
                : `The agent attempted recovery but could not complete the step: ${recoveryResult.reasoning}`,
            });
          this.logger.debug(
            `Inserted recovery trace event ${JSON.stringify(recoveryInsertedTraceEvent)}`,
          );

          // Always create a promotion candidate for human review, even if
          // the recovery only partially worked - the reviewer should see
          // and reject bad recoveries, not have them silently discarded.
          const promotionCandidate =
            await this.promotionCandidateService.createCandidate({
              runId: runId,
              testId: testId,
              stepId: stepToRun.stepId,
              originalStep: stepToRun,
              proposedStep: recoveryResult.newStep,
              reasoning: recoveryResult.reasoning,
            });
          this.logger.debug(
            `Inserted promotion candidate ${JSON.stringify(promotionCandidate)}`,
          );

          if (!recoveryResult.success) {
            this.logger.error(`Run failed: ${(err as Error).message}`);
            overallStatus = RunStatus.FAILED;
            break;
          }
        }
      }
    } catch (err) {
      this.logger.error(`Run failed: ${(err as Error).message}`);
      overallStatus = RunStatus.FAILED;
    } finally {
      this.logger.log(`Closing browser...`);
      await browser?.close();
    }

    const finishedAt = moment.utc().toDate();
    await this.runService.updateOverallStatusAndFinishedAtByRunId(
      runId,
      overallStatus,
      finishedAt,
    );
    this.logger.log(`Run ${runId} status updated to passed...`);

    return {
      run,
    };
  }

  private async executeDeterministicStep(
    page: Page,
    step: TestStep,
    test: TestDefinition,
  ) {
    let response: Response | null = null;
    switch (step.action) {
      case 'goto':
        response = await page.goto(step.value ?? test.targetUrl, {
          timeout: 10000,
        });
        break;
      case 'click':
        await page.click(step.selector, { timeout: 5000 });
        response = null;
        break;
      case 'fill':
        await page.fill(step.selector, step.value ?? '', {
          timeout: 2000,
        });
        response = null;
        break;
      case 'assertVisible':
        await page.waitForSelector(step.selector, {
          state: 'visible',
          timeout: 2000,
        });
        response = null;
        break;
      case 'assertText':
        await page.waitForSelector(step.selector, {
          timeout: 2000,
        });
        response = null;
        break;
      default:
        this.logger.warn('No action provided');
        break;
    }

    return response;
  }

  /** Simulates UI drift by mangling the selector so it can no longer match. */
  private corruptSelector(step: TestStep): TestStep {
    return {
      ...step,
      selector: step.selector
        ? `${step.selector}-drifted-nonexistent`
        : step.selector,
    };
  }

  async reRunTillStep(testId: string, order: number) {
    const testStore = await this.testStoreService.get(testId);

    if (!testStore.testDefinition) {
      throw new NotFoundException('Test not found');
    }
    this.logger.log(`Running test ${testId}}`);
    const testDefinition = testStore.testDefinition;
    let browser: Browser | undefined;
    let recoveryResult = null;
    try {
      this.logger.log(`Starting browser...`);
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      for (const step of testStore.testSteps) {
        const shouldForceBreak = order === step.order;
        const stepToRun = shouldForceBreak ? this.corruptSelector(step) : step;
        this.logger.debug(
          `Should step ${stepToRun.order} force break? : ${shouldForceBreak}`,
        );

        const start = performance.now();
        try {
          this.logger.debug(
            `Running deterministic step ${stepToRun.order} on "${stepToRun.selector}" with value "${stepToRun.value}"`,
          );
          const response = await this.executeDeterministicStep(
            page,
            stepToRun,
            testDefinition,
          );
          this.logger.debug(
            `Response from deterministic step ${stepToRun.order}: ${JSON.stringify(response)}`,
          );
          const end = performance.now();
          this.logger.debug(
            `Time taken for step ${stepToRun.order}: ${end - start}`,
          );

          // This should never execute since every failure should raise an exception
          if (shouldForceBreak) {
            break;
          }
        } catch (err) {
          const end = performance.now();
          this.logger.debug(
            `Time taken for step ${stepToRun.order}: ${end - start}`,
          );
          const failureReason = (err as Error).message;
          this.logger.warn(
            `Step ${stepToRun.order} failed deterministically: ${failureReason}`,
          );

          recoveryResult = await this.agenticExecutionService.recoverStep(
            page,
            stepToRun,
            testDefinition,
            failureReason,
          );

          break;
        }
      }
    } catch (err) {
      this.logger.error(`Run failed: ${(err as Error).message}`);
    } finally {
      this.logger.log(`Closing browser...`);
      await browser?.close();
    }

    this.logger.debug(`recoveryResult: ${JSON.stringify(recoveryResult)}`);

    return {
      recoveryResult,
    };
  }
}
