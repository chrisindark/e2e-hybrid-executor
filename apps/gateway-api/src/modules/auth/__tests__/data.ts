export const buildIssueTokenInput = (overrides: Record<string, unknown> = {}) => ({
  tenantId: 'tenant-1',
  actorId: 'user-1',
  actorType: 'user',
  planTier: 'free',
  expiresInSeconds: 43200,
  ...overrides,
});

export const buildJwtClaims = (overrides: Record<string, unknown> = {}) => ({
  tenantId: 'tenant-1',
  sub: 'user-1',
  type: 'user',
  planTier: 'free',
  exp: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});
