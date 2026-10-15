import { mockConfigService } from 'test/helpers/mock-factory';
import type { ConfigService } from '@nestjs/config';

export const createGuardConfigMock = () =>
  mockConfigService({
    JWT_SECRET: 'test-secret',
  }) as unknown as ConfigService;

// Re-export for backward compatibility with index.ts
export { mockConfigService };
