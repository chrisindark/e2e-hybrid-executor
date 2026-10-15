import { RequestContext } from '@repo/telemetry';
import type { Request, Response } from 'express';

import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
} from '../../middlewares/correlation-id.middleware';

/**
 * Path portion of the request URL, with the query string stripped.
 */
export function getRequestPath(request: Request): string {
  return (request.originalUrl ?? request.url ?? '').split('?')[0];
}

/**
 * Resolves the correlation id for the current request. The request-scoped async
 * store set by the CorrelationIdMiddleware is the primary source; the headers
 * (or the response header it also sets) act as a fallback.
 */
export function resolveCorrelationId(
  request: Request,
  response: Response,
): string {
  const context = RequestContext.getOptional();

  if (context?.correlationId !== undefined) {
    return context.correlationId;
  }

  const headerValue =
    response.getHeader(CORRELATION_ID_HEADER) ??
    request.headers[CORRELATION_ID_HEADER] ??
    request.headers[REQUEST_ID_HEADER] ??
    '';

  if (Array.isArray(headerValue)) {
    return headerValue[0];
  }

  if (typeof headerValue === 'number') {
    return String(headerValue);
  }

  return headerValue;
}
