import z from 'zod';

export const recoverStepSchema = z.object({
  selector: z
    .string()
    .describe(
      'a CSS selector that exists in the provided DOM snapshot and satisfies the intent',
    ),
  action: z
    .string()
    .describe('click" | "fill" | "assertText" | "assertVisible'),
  value: z
    .string()
    .describe(
      'input value only when action is fill; omit for assertText (its expected text is reused from the failed step)',
    ),
  reasoning: z
    .string()
    .describe(
      'one or two sentences explaining why you chose this selector, in plain English a non-technical reader could follow',
    ),
});

export const agenticPrimaryDecisionSchema = z.object({
  done: z
    .boolean()
    .describe(
      'true if goal is achieved or execution cannot proceed further, false otherwise',
    ),
  goalAchieved: z
    .boolean()
    .describe('true if the overall goal was successfully met'),
  action: z
    .enum(['goto', 'click', 'fill', 'assertText', 'assertVisible'])
    .nullable()
    .describe('the next action to perform on the page, or null if done'),
  selector: z
    .string()
    .nullable()
    .describe(
      'a CSS selector that exists in the provided DOM snapshot, or null if action is goto/null',
    ),
  value: z
    .string()
    .nullable()
    .describe(
      'input value for fill, target URL for goto, or the exact literal expected text for assertText; null otherwise',
    ),
  reasoning: z
    .string()
    .describe(
      'one or two sentences explaining why you chose this action or declared done',
    ),
});
