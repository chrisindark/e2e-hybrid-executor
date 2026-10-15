export const buildHealthResponse = (overrides: Record<string, unknown> = {}) => ({
  status: 'ok',
  info: {
    database: { status: 'up' },
    redis: { status: 'up' },
  },
  error: {},
  details: {
    database: { status: 'up' },
    redis: { status: 'up' },
  },
  ...overrides,
});
