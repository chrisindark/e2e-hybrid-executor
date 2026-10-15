export const buildTenantContext = (overrides: Record<string, unknown> = {}) => ({
  tenantId: 'tenant-1',
  ...overrides,
});

export const buildTenantId = () => 'tenant-1';
