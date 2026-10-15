import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { RequestContext } from '@repo/telemetry';
import type { NextFunction, Request, Response } from 'express';

import { HTTP_REQUESTS_SHOULD_NOT_LOG } from './middleware.constants';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = performance.now();
    const requestUrl = req.originalUrl ?? req.url;
    const path = requestUrl.split('?')[0];

    if (this.shouldSkip(path)) {
      next();

      return;
    }

    const podName = process.env.HOSTNAME ?? 'unknown-pod';

    this.logger.log(
      {
        event: 'http.request',
        message: `Incoming ${req.method} ${path}`,
        method: req.method,
        path,
        podName,
        userAgent: req.get('user-agent'),
        ...this.contextFields(),
      },
      RequestLoggingMiddleware.name,
    );

    res.on('finish', () => {
      const durationMs =
        Math.round((performance.now() - startTime) * 100) / 100;

      this.logger.log(
        {
          event: 'http.response',
          message: `Completed ${req.method} ${path} ${res.statusCode} in ${durationMs}ms`,
          method: req.method,
          path,
          statusCode: res.statusCode,
          durationMs,
          contentLength: res.getHeader('content-length'),
          podName,
          ...this.contextFields(),
        },
        RequestLoggingMiddleware.name,
      );
    });

    next();
  }

  private shouldSkip(path: string): boolean {
    return HTTP_REQUESTS_SHOULD_NOT_LOG.some((prefix: string) =>
      path.startsWith(prefix),
    );
  }

  private contextFields(): Record<string, unknown> {
    const context = RequestContext.getOptional();
    const fields: Record<string, unknown> = {};
    const correlationId = context?.correlationId;
    const tenantId = context?.tenantId;

    if (correlationId !== undefined && correlationId !== '') {
      fields.correlationId = correlationId;
    }

    if (tenantId !== undefined && tenantId !== '' && tenantId !== 'anonymous') {
      fields.tenantId = tenantId;
    }

    return fields;
  }
}
