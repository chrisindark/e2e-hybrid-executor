import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestContext } from '@repo/telemetry';
import { TenantContext } from '@repo/types';
import { NextFunction, Request, Response } from 'express';

import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
} from '../../middlewares/correlation-id.middleware';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  /**
   * Guards run *after* middleware, so `req.user` is never populated yet. We
   * therefore always establish a mutable, anonymous context for every request;
   * `JwtAuthGuard` overwrites the tenant/actor fields once it has verified the
   * bearer token. This keeps the telemetry `RequestContext` initialised for all
   * requests instead of only the unauthenticated health/auth paths.
   */
  use(req: Request, _res: Response, next: NextFunction) {
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();
    const requestId =
      (req.headers[REQUEST_ID_HEADER] as string) || randomUUID();

    const context: TenantContext = {
      tenantId: 'anonymous',
      actorId: 'anonymous',
      actorType: 'user',
      correlationId,
      requestId,
      planTier: 'free',
    };

    RequestContext.run(context, () => next());
  }
}
