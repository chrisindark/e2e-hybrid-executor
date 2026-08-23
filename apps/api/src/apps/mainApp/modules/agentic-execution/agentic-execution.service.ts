import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Page } from 'playwright';
import { ZodObject } from 'zod';

import {
  agenticPrimaryDecisionSchema,
  recoverStepSchema,
} from '../../../../shared/agent-outcome.schema';
import { TestDefinition } from '../../../../shared/test-definition.entity';
import { TestStep } from '../../../../shared/test-step.entity';
import { StepStatus } from '../../../../shared/trace-event.entity';
import { TestAction } from '../../../../shared/types';
import { GeminiService } from '../utils/gemini/gemini.service';
import { OpenAIService } from '../utils/open-ai/open-ai.service';

export interface RecoveryResult {
  success: boolean;
  newStep: TestStep;
  reasoning: string;
  actionTaken: string;
}

export interface DecisionResult {
  action: TestAction;
  selector: string;
  value: string;
  reasoning: string;
}

export interface AgenticPrimaryDecision {
  done: boolean;
  goalAchieved: boolean;
  action: TestAction | null;
  selector: string | null;
  value: string | null;
  reasoning: string;
}

export interface AgenticPrimaryActionResult {
  index: number;
  action: string;
  selector?: string;
  value?: string;
  reasoning: string;
  status: StepStatus;
  durationMs: number;
  customerExplanation: string;
  error?: string;
}

export interface AgenticPrimaryRunResult {
  goalAchieved: boolean;
  actions: AgenticPrimaryActionResult[];
}

/**
 * Agentic recovery & Agentic primary execution. Deliberately operates on the SAME Playwright `Page`
 * instance the deterministic runner was using - no new browser, no new
 * context. This is the part of the assignment that's easiest to fake
 * (spin up a second browser, screenshot-diff, call it a day) and most
 * important to get right, so it's kept as its own module with a narrow,
 * explicit contract: give it a page + a failed step + why it failed,
 * get back a recovered step + the reasoning behind it.
 */
@Injectable()
export class AgenticExecutionService {
  private readonly logger = new Logger(AgenticExecutionService.name);

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly geminiService: GeminiService,
  ) {}

  async recoverStep(
    page: Page,
    failedStep: TestStep,
    failedTest: TestDefinition,
    failureReason: string,
  ): Promise<RecoveryResult> {
    // 1. Read live DOM state - a trimmed snapshot of interactive elements,
    //    not the full HTML (keeps token cost sane and signal high).
    const domSnapshot = await this.getInteractiveElementsSnapshot(page);

    // 2. Ask the model to propose a recovery action given the intent and
    //    what's actually on the page right now.
    const systemPrompt = `You are an agentic test executor. A deterministic test step just failed because the page changed or the step could not be executed as originally defined.
    Your job is to recover the ORIGINAL INTENT of the step using the CURRENT page state and the test definition.
    There are two categories of steps:
    1. DOM interaction steps
      - click
      - fill
      - assertText
      - assertVisible

      For these steps, find the correct element on the CURRENT page.
      The returned selector MUST be a CSS selector that exists in the provided DOM snapshot and satisfies the original intent.

    2. Navigation steps
      - goto

      A goto step does NOT require a DOM selector.
      If the failed step's action is "goto", recover the navigation target from the test definition's "targetUrl".
      Do NOT attempt to find a DOM element for a goto step.

      Respond ONLY with valid JSON, no markdown fences, no prose.

      For DOM interaction steps, respond with:
      {
        "selector": "a CSS selector that exists in the provided DOM snapshot and satisfies the intent",
        "action": "click" | "fill" | "assertText" | "assertVisible",
        "value": "only if action is fill",
        "reasoning": "one or two sentences explaining why you chose this selector, in plain English a non-technical reader could follow"
      }

      For a goto step, respond with:
      {
        "selector": null,
        "action": "goto",
        "value": "the targetUrl from the test definition",
        "reasoning": "one or two sentences explaining why this URL is the correct navigation target."
      }

      Important:
      - Preserve the original action when recovering a step unless recovery requires a different action.
      - For "goto", use the test definition's targetUrl when value is not available.
      - Never infer a goto URL from the DOM when targetUrl is provided.
      - Never fabricate a selector for a goto step.
      - For DOM interaction steps, never return a selector that is not present in the provided DOM snapshot.
      - Return only valid JSON.`;

    const userPrompt = `
    Original test definition target url: "${failedTest.targetUrl}"
    Original step intent: "${failedStep.description}"
    Expected outcome: "${failedStep.expectedOutcome}"
    Original (now-broken) selector: "${failedStep.selector}"
    Failure reason: "${failureReason}"

    Current page interactive elements (JSON):
    ${JSON.stringify(domSnapshot, null, 2)}
    `;

    let schema: ZodObject | null = recoverStepSchema;
    let schemaName = 'recoverStepSchema';

    if (domSnapshot.length === 0) {
      schema = null;
      schemaName = '';
    }
    // LLM call
    // const completion = await this.openAIService.normalCompletion(
    //   userPrompt,
    //   systemPrompt,
    //   'openai/gpt-oss-20b',
    //   schema,
    //   schemaName,
    // );

    const completion = await this.geminiService.normalCompletion(
      userPrompt,
      systemPrompt,
      'gemini-3.5-flash-lite',
      schema,
      schemaName,
    );

    if (!completion) {
      throw new InternalServerErrorException('No completion received from LLM');
    }

    this.logger.log(`Output: ${completion?.output}`);
    this.logger.log(`Usage: ${JSON.stringify(completion?.usage)}`);
    const decision: DecisionResult = JSON.parse(completion?.output) ?? {
      action: '',
      selector: '',
      value: '',
      reasoning: '',
    };

    let success = true;
    let actionTaken = `${decision.action} on "${decision.selector} with value ${decision.value}"`;
    try {
      if (decision.action === 'click') {
        await page.click(decision.selector, { timeout: 2000 });
      } else if (decision.action === 'fill') {
        await page.fill(decision.selector, decision.value ?? '', {
          timeout: 5000,
        });
      } else if (decision.action === 'assertVisible') {
        await page.waitForSelector(decision.selector, {
          state: 'visible',
          timeout: 5000,
        });
      } else if (decision.action === 'assertText') {
        await page.waitForSelector(decision.selector, { timeout: 5000 });
      }
    } catch (err) {
      const failureReason = (err as Error).message;
      this.logger.warn(
        `Step ${failedStep.order} failed agentically: ${failureReason}`,
      );
      success = false;
      actionTaken += ` (execution failed: ${(err as Error).message})`;
      this.logger.warn(`Agentic recovery action failed: ${actionTaken}`);
    }

    const newStep: TestStep = {
      ...failedStep,
      selector: decision.selector,
      action: decision.action,
      value: decision.value,
    };

    const recoveryResult = {
      success,
      newStep,
      reasoning: decision.reasoning,
      actionTaken,
    };

    return recoveryResult;
  }

  /**
   * Pulls a compact list of interactive elements (buttons, inputs, links)
   * with their key attributes, so the model has real anchors to reason
   * over instead of guessing selectors from scratch.
   */
  private async getInteractiveElementsSnapshot(page: Page) {
    return page.evaluate(() => {
      const els = Array.from(
        document.querySelectorAll(
          'button, input, a, [data-test], [id], [class]',
        ),
      ).slice(0, 80); // cap for token budget

      return els.map((el) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        classes: el.className ? String(el.className).slice(0, 80) : undefined,
        dataTest: el.getAttribute('data-test') || undefined,
        text: el.textContent?.trim().slice(0, 40) || undefined,
        type: el.getAttribute('type') || undefined,
      }));
    });
  }

  async runAgentically(
    page: Page,
    test: TestDefinition,
    maxSteps = 12,
    timeoutMs = 60000,
  ): Promise<AgenticPrimaryRunResult> {
    const history: string[] = [];
    const actions: AgenticPrimaryActionResult[] = [];
    const startTime = performance.now();

    if (page.url() === 'about:blank' && test.targetUrl) {
      const navStart = performance.now();
      try {
        await page.goto(test.targetUrl, { timeout: 10000 });
        const navEnd = performance.now();
        history.push(`Initial navigation to "${test.targetUrl}" -> Succeeded.`);
        actions.push({
          index: 1,
          action: 'goto',
          value: test.targetUrl,
          reasoning: 'Initial navigation to target URL',
          status: StepStatus.PASSED,
          durationMs: navEnd - navStart,
          customerExplanation: `Navigated to initial target URL: ${test.targetUrl}`,
        });
      } catch (err) {
        const navEnd = performance.now();
        const msg = (err as Error).message;
        history.push(
          `Initial navigation to "${test.targetUrl}" -> Failed: ${msg}`,
        );
        actions.push({
          index: 1,
          action: 'goto',
          value: test.targetUrl,
          reasoning: 'Initial navigation to target URL',
          status: StepStatus.FAILED,
          durationMs: navEnd - navStart,
          customerExplanation: `Failed initial navigation to ${test.targetUrl}: ${msg}`,
          error: msg,
        });
      }
    }

    const systemPrompt = `You are an autonomous AI test executor running in Agentic-Primary mode.
Your objective is to satisfy the user's overall goal in plain English through an iterative decision-action-observation loop.

On each step:
1. Analyze the overall goal, target URL, execution history of prior steps, and current interactive DOM elements.
2. Determine if the overall goal has been satisfied or if progress can be made with a single next action.

Respond ONLY with valid JSON matching this schema:
{
  "done": boolean,
  "goalAchieved": boolean,
  "action": "goto" | "click" | "fill" | "assertText" | "assertVisible" | null,
  "selector": string | null,
  "value": string | null,
  "reasoning": "one or two sentences explaining why this action was chosen or why execution is complete"
}

Rules:
- If the overall goal is satisfied, respond with: "done": true, "goalAchieved": true, "action": null, "selector": null, "value": null.
- If you hit an unrecoverable state or cannot satisfy the goal, respond with: "done": true, "goalAchieved": false, "action": null, "selector": null, "value": null.
- For DOM interaction steps ("click", "fill", "assertText", "assertVisible"), "selector" MUST be a CSS selector present in the provided DOM snapshot.
- For "fill", "value" is the string to enter. For "goto", "value" is the target URL.
- Never repeat a failed action unless conditions have changed.`;

    for (let i = 0; i < maxSteps; i++) {
      const stepIndex = actions.length + 1;
      const elapsed = performance.now() - startTime;

      if (elapsed > timeoutMs) {
        this.logger.warn(`Agentic-primary loop timed out after ${elapsed}ms`);
        break;
      }

      const domSnapshot = await this.getInteractiveElementsSnapshot(page);

      const userPrompt = `
Overall Goal: "${test.originalIntent}"
Target URL: "${test.targetUrl}"
Current Page URL: "${page.url()}"

Prior Execution History:
${history.length > 0 ? history.map((h, idx) => `${idx + 1}. ${h}`).join('\n') : 'No prior actions taken yet.'}

Current Page Interactive Elements (JSON):
${JSON.stringify(domSnapshot, null, 2)}
`;

      const completion = await this.geminiService.normalCompletion(
        userPrompt,
        systemPrompt,
        'gemini-3.5-flash-lite',
        agenticPrimaryDecisionSchema,
        'agenticPrimaryDecisionSchema',
      );

      if (!completion?.output) {
        this.logger.error(
          'No completion output received for agentic primary step',
        );
        break;
      }

      const decision: AgenticPrimaryDecision = JSON.parse(
        completion.output,
      ) ?? {
        done: true,
        goalAchieved: false,
        action: null,
        selector: null,
        value: null,
        reasoning: 'Failed to parse decision',
      };

      this.logger.debug(
        `Agentic Primary Decision [Step ${stepIndex}]: ${JSON.stringify(decision)}`,
      );

      if (decision.done) {
        return { goalAchieved: decision.goalAchieved, actions };
      }

      const actionStart = performance.now();
      let status = StepStatus.PASSED;
      let errorMsg: string | undefined;

      try {
        if (decision.action === 'goto') {
          await page.goto(decision.value ?? test.targetUrl, { timeout: 10000 });
        } else if (decision.action === 'click' && decision.selector) {
          await page.click(decision.selector, { timeout: 5000 });
        } else if (decision.action === 'fill' && decision.selector) {
          await page.fill(decision.selector, decision.value ?? '', {
            timeout: 5000,
          });
        } else if (decision.action === 'assertVisible' && decision.selector) {
          await page.waitForSelector(decision.selector, {
            state: 'visible',
            timeout: 5000,
          });
        } else if (decision.action === 'assertText' && decision.selector) {
          await page.waitForSelector(decision.selector, { timeout: 5000 });
        }
      } catch (err) {
        status = StepStatus.FAILED;
        errorMsg = (err as Error).message;
      }
      const actionEnd = performance.now();

      const actionDesc = `${decision.action} on "${decision.selector ?? decision.value ?? ''}"`;

      if (status === StepStatus.PASSED) {
        history.push(
          `Step ${stepIndex}: ${actionDesc} -> Succeeded. Reasoning: ${decision.reasoning}`,
        );
      } else {
        history.push(
          `Step ${stepIndex}: ${actionDesc} -> Failed: ${errorMsg}. Reasoning: ${decision.reasoning}`,
        );
      }

      actions.push({
        index: stepIndex,
        action: decision.action ?? 'unknown',
        selector: decision.selector ?? undefined,
        value: decision.value ?? undefined,
        reasoning: decision.reasoning,
        status,
        durationMs: actionEnd - actionStart,
        customerExplanation: `Agentic primary step ${stepIndex}: ${decision.reasoning}`,
        error: errorMsg,
      });

      if (status === StepStatus.FAILED) {
        break;
      }
    }

    return { goalAchieved: false, actions };
  }
}
