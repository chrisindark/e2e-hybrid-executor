import 'reflect-metadata';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-unit-tests-only';
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test-groq-key';
process.env.GROQ_API_URL =
  process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-gemini-key';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://orchestrator:orchestrator@localhost:5432/orchestrator';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

jest.setTimeout(15000);
