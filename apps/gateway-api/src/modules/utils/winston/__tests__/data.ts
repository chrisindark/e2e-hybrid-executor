export const buildCorrelationId = () => 'test-correlation-id-123';

export const buildTenantId = () => 'tenant-1';

export const buildLogEntry = (overrides: Record<string, unknown> = {}) => ({
  message: 'test log entry',
  level: 'info',
  timestamp: new Date('2025-01-01T00:00:00Z'),
  correlationId: buildCorrelationId(),
  ...overrides,
});
