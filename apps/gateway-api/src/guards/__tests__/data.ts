import type { ExecutionContext } from '@nestjs/common';

export const buildExecutionContext = (
  overrides: Record<string, unknown> = {},
): ExecutionContext =>
  ({
    getHandler: () => () => undefined,
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
        path: '/v1/test',
      }),
      getResponse: () => ({}),
    }),
    switchToRpc: () => ({}),
    switchToWs: () => ({}),
    getArgByIndex: () => undefined,
    getArgs: () => [],
    getType: () => 'http',
    ...overrides,
  }) as unknown as ExecutionContext;

export const buildPublicMetadata = () => true;
