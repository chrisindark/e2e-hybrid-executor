import { mockConfigService } from 'test/helpers/mock-factory';
import type { ConfigService } from '@nestjs/config';

export const createGeminiConfigMock = () =>
  mockConfigService({
    GEMINI_API_KEY: 'test-gemini-key',
  }) as unknown as ConfigService;

// Re-export for backward compatibility with index.ts
export { mockConfigService };
