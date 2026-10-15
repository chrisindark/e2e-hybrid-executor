export const buildMockRequest = (overrides: Record<string, unknown> = {}) => ({
  method: 'GET',
  url: '/v1/ping',
  originalUrl: '/v1/ping',
  headers: {},
  path: '/v1/ping',
  ...overrides,
});

export const buildMockResponse = () => {
  const store = new Map<string, unknown>();

  return {
    statusCode: 200,
    setHeader: jest.fn((key: string, value: unknown) => store.set(key, value)),
    getHeader: jest.fn((key: string) => store.get(key)),
    on: jest.fn(),
  } as any;
};

export const buildMockNext = () => jest.fn();
