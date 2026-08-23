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
  value: z.string().describe('a value to be filled only if action is fill'),
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
      'input value for fill action or targetUrl for goto action, or null if not applicable',
    ),
  reasoning: z
    .string()
    .describe(
      'one or two sentences explaining why you chose this action or declared done',
    ),
});
