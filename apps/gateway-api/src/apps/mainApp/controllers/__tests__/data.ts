export const buildIssueTokenDto = (overrides: Record<string, unknown> = {}) => ({
  tenantId: 'tenant-1',
  actorId: 'user-1',
  actorType: 'user',
  planTier: 'free',
  expiresInSeconds: 43200,
  ...overrides,
});

export const buildAuthenticatedRequest = (overrides: Record<string, unknown> = {}) => ({
  headers: {},
  user: {
    tenantId: 'tenant-1',
    sub: 'user-1',
    type: 'user',
    planTier: 'free',
  },
  ...overrides,
});

export const buildDecideDto = (overrides: Record<string, unknown> = {}) => ({
  approve: true,
  ...overrides,
});
