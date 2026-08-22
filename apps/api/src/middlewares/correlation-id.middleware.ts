import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { RequestContext } from '../apps/mainApp/modules/utils/async-local-storage/async-local-storage.type';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(
    private readonly asyncLocalStorage: AsyncLocalStorage<RequestContext>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      req.headers['x-correlation-id']?.toString() ||
      req.headers['x-request-id']?.toString() ||
      randomUUID();

    res.setHeader('x-correlation-id', correlationId);

    this.asyncLocalStorage.run({ correlationId }, () => {
      next();
    });
  }
}
