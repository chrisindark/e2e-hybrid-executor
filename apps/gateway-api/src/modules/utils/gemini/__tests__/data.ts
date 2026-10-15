export const buildGeminiCompletion = (overrides: Record<string, unknown> = {}) => ({
  output: '{"steps":[]}',
  usage: { totalTokens: 100, promptTokens: 50, completionTokens: 50 },
  ...overrides,
});
