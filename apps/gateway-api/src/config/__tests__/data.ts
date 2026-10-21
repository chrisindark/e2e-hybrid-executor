export const buildTestEnv = (overrides: Record<string, string> = {}) => ({
  NODE_ENV: 'test',
  APP_PORT: '3001',
  APP_ADDRESS: '0.0.0.0',
  JWT_SECRET: 'test-secret',
  GROQ_API_KEY: 'test-groq-key',
  GROQ_API_URL: 'https://api.groq.com/openai/v1',
  GEMINI_API_KEY: 'test-gemini-key',
  DATABASE_URL:
    'postgresql://orchestrator:orchestrator@localhost:5432/orchestrator',
  REDIS_URL: 'redis://localhost:6379',
  ...overrides,
});
