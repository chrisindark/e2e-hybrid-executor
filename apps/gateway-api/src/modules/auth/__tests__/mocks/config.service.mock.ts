import { mockConfigService } from 'test/helpers/mock-factory';
import type { ConfigService } from '@nestjs/config';

export const createAuthConfigMock = (overrides: Record<string, unknown> = {}) =>
  mockConfigService({
    JWT_SECRET: 'test-secret',
    ...overrides,
  }) as unknown as ConfigService;

// Re-export for backward compatibility with index.ts
export { mockConfigService };
