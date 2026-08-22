import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';

import { TestStep } from '../../../../shared/test-step.entity';
import { OpenAIService } from '../utils/open-ai/open-ai.service';

/**
 * Converts a natural-language test intent into a structured TestDefinition.
 *
 * Model choice: openai/gpt-oss-20b is enough for step extraction against a known,
 * simple target (saucedemo.com) and keeps iteration cheap during test runs.
 */
@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);

  constructor(private readonly openAIService: OpenAIService) {}

  async generateTest(intent: string, targetUrl: string) {
    const systemPrompt = `You convert a plain-English test intent into a structured, ordered list of test steps for the site ${targetUrl} (Sauce Demo, a standard e-commerce demo site).

Known Sauce Demo selectors you may use when relevant:
- Username field: #user-name
- Password field: #password
- Login button: #login-button
- Product list item: .inventory_item
- "Add to cart" button: [data-test^="add-to-cart"]
- Cart icon: .shopping_cart_link
- Checkout button: #checkout
- First name field: #first-name
- Last name field: #last-name
- Postal code field: #postal-code
- Continue button: #continue
- Finish button: #finish

Respond ONLY with valid JSON matching this shape, no markdown fences, no prose:
{
  "steps": [
    {
      "order": 1,
      "description": "short human-readable description",
      "action": "goto" | "click" | "fill" | "assertText" | "assertVisible",
      "selector": "CSS selector, omit for goto",
      "value": "input value, only for fill actions, except for goto action where value is the targetUrl",
      "expectedOutcome": "what should be true after this step"
    }
  ]
}`;

    const completion = await this.openAIService.normalCompletion(
      intent,
      systemPrompt,
    );
    // const completion = await this.client.chat.completions.create({
    //   model: 'openai/gpt-oss-20b',
    //   messages: [
    //     { role: 'system', content: systemPrompt },
    //     { role: 'user', content: intent },
    //   ],
    //   response_format: { type: 'json_object' },
    // });

    const raw = completion?.output ?? '{"steps":[]}';
    const parsed = JSON.parse(raw) as { steps: Omit<TestStep, 'stepId'>[] };

    const steps: TestStep[] = parsed.steps.map((s) => ({
      stepId: randomUUID(),
      ...s,
    }));

    const now = moment.utc().toDate();

    // add code to save this to test definition and test step entities
    return {
      testId: randomUUID(),
      name: intent.slice(0, 60),
      originalIntent: intent,
      targetUrl,
      steps,
      createdAt: now,
      updatedAt: now,
    };
  }
}
