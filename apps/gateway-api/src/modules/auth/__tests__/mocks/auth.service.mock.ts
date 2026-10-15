import { createMock } from 'test/helpers/mock-factory';
import type { AuthService, IssuedToken } from '../../auth.service';

export const mockAuthService = () => createMock<AuthService>();

export const buildIssuedToken = (
  overrides: Partial<IssuedToken> = {},
): IssuedToken => ({
  accessToken: 'mock-access-token',
  tokenType: 'Bearer',
  expiresIn: 43200,
  claims: {
    tenantId: 'tenant-1',
    sub: 'user-1',
    type: 'user',
    planTier: 'free',
  },
  ...overrides,
});
