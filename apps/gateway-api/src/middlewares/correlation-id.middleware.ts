import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { RequestContext } from '../apps/mainApp/modules/utils/async-local-storage/async-local-storage.type';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(
    private readonly asyncLocalStorage: AsyncLocalStorage<RequestContext>,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      firstHeaderValue(req.headers[CORRELATION_ID_HEADER]) ?? randomUUID();
    const requestId =
      firstHeaderValue(req.headers[REQUEST_ID_HEADER]) ?? randomUUID();

    // Propagate the correlation id both downstream and back to the caller.
    req.headers[CORRELATION_ID_HEADER] = correlationId;
    req.headers[REQUEST_ID_HEADER] = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, requestId);
    res.setHeader(REQUEST_ID_HEADER, requestId);

    // Everything executed within next() inherits this store, including
    // async callbacks registered inside it (e.g. res.on('finish')).
    this.asyncLocalStorage.run({ correlationId, requestId }, () => next());
  }
}
