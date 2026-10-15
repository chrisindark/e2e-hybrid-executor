export const buildPingResponse = (overrides: Partial<{ message: string }> = {}) => ({
  message: 'pong',
  ...overrides,
});

export const buildPingDetailResponse = (id: string, overrides: Partial<{ message: string }> = {}) => ({
  message: `pong: #${id}`,
  ...overrides,
});

export const buildAuthenticatedResponse = () => ({
  message: 'authenticated pong',
});
