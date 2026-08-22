import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { Page } from 'playwright';

import { recoverStepSchema } from '../../../../shared/agent-outcome.schema';
import { TestStep } from '../../../../shared/test-step.entity';
import { TestAction } from '../../../../shared/types';
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

/**
 * Agentic recovery. Deliberately operates on the SAME Playwright `Page`
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

  constructor(private readonly openAIService: OpenAIService) {}

  async recoverStep(
    page: Page,
    failedStep: TestStep,
    failureReason: string,
  ): Promise<RecoveryResult> {
    // 1. Read live DOM state - a trimmed snapshot of interactive elements,
    //    not the full HTML (keeps token cost sane and signal high).
    const domSnapshot = await this.getInteractiveElementsSnapshot(page);

    // 2. Ask the model to propose a recovery action given the intent and
    //    what's actually on the page right now.
    const systemPrompt = `You are an agentic test executor. A deterministic test step just failed because the page changed.
      Your job is to recover the ORIGINAL INTENT of the step by finding the right element on the CURRENT page.
      Respond ONLY with valid JSON, no markdown fences, no prose:
      {
        "selector": "a CSS selector that exists in the provided DOM snapshot and satisfies the intent",
        "action": "click" | "fill" | "assertText" | "assertVisible",
        "value": "only if action is fill",
        "reasoning": "one or two sentences explaining why you chose this selector, in plain English a non-technical reader could follow"
      }`;

    const userPrompt = `Original step intent: "${failedStep.description}"
  Expected outcome: "${failedStep.expectedOutcome}"
  Original (now-broken) selector: "${failedStep.selector}"
  Failure reason: "${failureReason}"

  Current page interactive elements (JSON):
  ${JSON.stringify(domSnapshot, null, 2)}`;

    this.logger.debug(`UserPrompt: ${userPrompt}`);

    const completion = await this.openAIService.normalCompletion(
      userPrompt,
      systemPrompt,
      'openai/gpt-oss-20b',
      recoverStepSchema,
      'recoverStepSchema',
    );

    if (!completion) {
      throw new InternalServerErrorException(
        'No completion received from OpenAI',
      );
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
      ).slice(0, 60); // cap for token budget

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
}
