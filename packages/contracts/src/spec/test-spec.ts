import { z } from 'zod';

export const LocatorStrategySchema = z.enum([
  'test-id',
  'role',
  'text',
  'css',
  'xpath',
]);
export type LocatorStrategy = z.infer<typeof LocatorStrategySchema>;

export const AlternateLocatorSchema = z.object({
  strategy: LocatorStrategySchema,
  value: z.string().min(1),
  confidence: z.number().min(0).max(1).default(1.0),
});
export type AlternateLocator = z.infer<typeof AlternateLocatorSchema>;

export const StepLocatorSchema = z.object({
  primary: z.string().min(1),
  alternates: z.array(AlternateLocatorSchema).default([]),
  intent: z.string().describe('Semantic intent of this action'),
});
export type StepLocator = z.infer<typeof StepLocatorSchema>;

export const UiGotoStepSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('ui.goto'),
  url: z.string().url(),
  timeoutMs: z.number().positive().default(30000),
});

export const UiClickStepSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('ui.click'),
  locator: StepLocatorSchema,
  clickCount: z.number().int().positive().default(1),
  timeoutMs: z.number().positive().default(5000),
});

export const UiFillStepSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('ui.fill'),
  locator: StepLocatorSchema,
  value: z.string(),
  masked: z.boolean().default(false),
  timeoutMs: z.number().positive().default(5000),
});

export const UiAssertTextStepSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('ui.assertText'),
  locator: StepLocatorSchema,
  expectedText: z.string(),
  operator: z.enum(['equals', 'contains', 'matches_regex']).default('contains'),
  timeoutMs: z.number().positive().default(5000),
});

export const UiAssertVisibleStepSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('ui.assertVisible'),
  locator: StepLocatorSchema,
  timeoutMs: z.number().positive().default(5000),
});

export const UiStepSchema = z.discriminatedUnion('type', [
  UiGotoStepSchema,
  UiClickStepSchema,
  UiFillStepSchema,
  UiAssertTextStepSchema,
  UiAssertVisibleStepSchema,
]);

export const VariableExtractionSchema = z.object({
  variableName: z.string().regex(/^[a-zA-Z0-9_]+$/),
  jsonPath: z.string().min(1),
  fallback: z.string().optional(),
});

export const AssertionRuleSchema = z.object({
  path: z.string().min(1),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'greater_than',
    'less_than',
    'schema_valid',
  ]),
  expected: z.unknown(),
});

export const ApiRequestStepSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('api.request'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().min(1),
  headers: z.record(z.string()).default({}),
  body: z.unknown().optional(),
  extract: z.array(VariableExtractionSchema).default([]),
  assertions: z.array(AssertionRuleSchema).default([]),
  timeoutMs: z.number().positive().default(10000),
});

export const TestStepSchema = z.discriminatedUnion('type', [
  UiGotoStepSchema,
  UiClickStepSchema,
  UiFillStepSchema,
  UiAssertTextStepSchema,
  UiAssertVisibleStepSchema,
  ApiRequestStepSchema,
]);
export type TestStep = z.infer<typeof TestStepSchema>;

export const TestSpecV1Schema = z.object({
  schemaVersion: z.literal('v1'),
  name: z.string().min(1),
  description: z.string().optional(),
  targetBaseUrl: z.string().url(),
  envVariables: z.record(z.string()).default({}),
  steps: z.array(TestStepSchema).min(1),
  tags: z.array(z.string()).default([]),
});
export type TestSpecV1 = z.infer<typeof TestSpecV1Schema>;
