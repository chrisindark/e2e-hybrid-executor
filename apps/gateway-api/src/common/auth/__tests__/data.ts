export const buildJwtPayload = (overrides: Record<string, unknown> = {}) => ({
  tenantId: 'tenant-1',
  sub: 'user-1',
  type: 'user',
  planTier: 'free',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  ...overrides,
});

export const buildTestJwtSecret = () => 'test-secret-key-for-unit-tests-only';

export const buildTestJwtToken = () =>
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6InRlbmFudC0xIiwic3ViIjoidXNlci0xIiwidHlwZSI6InVzZXIiLCJwbGFuVGllciI6ImZyZWUiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTAwMDAwMDAwMH0.test-signature';
