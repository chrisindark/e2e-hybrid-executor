import { HttpStatus } from '@nestjs/common';

export const buildMockRequest = (overrides: Record<string, unknown> = {}) => ({
  method: 'GET',
  url: '/v1/ping',
  originalUrl: '/v1/ping',
  headers: {},
  ...overrides,
});

export const buildMockResponse = () => {
  const res: Record<string, unknown> = {
    statusCode: HttpStatus.OK,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn().mockReturnValue(undefined),
  };

  return res as any;
};

export const buildArgumentsHost = (request: unknown, response: unknown) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }) as any;
