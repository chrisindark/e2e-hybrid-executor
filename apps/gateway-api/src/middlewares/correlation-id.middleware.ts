import { randomUUID } from 'node:crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestContext } from '@repo/telemetry';
import type { TenantContext } from '@repo/types';
import type { NextFunction, Request, Response } from 'express';

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

/**
 * Establishes the single request-scoped context (`RequestContext` from
 * `@repo/telemetry`) and propagates correlation identifiers on the wire.
 *
 * This is the *only* place an HTTP request enters the context. The global
 * `JwtAuthGuard` runs after middleware and overwrites the tenant/actor fields
 * once the bearer token is verified, so the context starts out anonymous and is
 * still initialised for public routes (health, auth token minting).
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
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

    const context: TenantContext = {
      tenantId: 'anonymous',
      actorId: 'anonymous',
      actorType: 'user',
      correlationId,
      requestId,
      planTier: 'free',
    };

    // Everything executed within next() inherits this store, including
    // async callbacks registered inside it (e.g. res.on('finish')).
    RequestContext.run(context, () => next());
  }
}
