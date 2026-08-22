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
