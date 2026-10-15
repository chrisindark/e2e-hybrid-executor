import { mockConfigService } from 'test/helpers/mock-factory';
import type { ConfigService } from '@nestjs/config';

export const createOpenAIConfigMock = () =>
  mockConfigService({
    GROQ_API_KEY: 'test-groq-key',
    GROQ_API_URL: 'https://api.groq.com/openai/v1',
  }) as unknown as ConfigService;

// Re-export for backward compatibility with index.ts
export { mockConfigService };
