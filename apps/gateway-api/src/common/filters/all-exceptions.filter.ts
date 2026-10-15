import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { ErrorResponseBody } from './error-response.type';
import { getRequestPath, resolveCorrelationId } from './error-response.util';

interface NormalizedException {
  name: string;
  message: string;
  stack?: string;
}

/**
 * Catch-all handler for everything that is *not* an `HttpException`: unexpected
 * runtime errors, third-party library failures, thrown non-`Error` values, ...
 *
 * Like the `HttpExceptionFilter` it always logs the failure - regardless of
 * whether the controller or service already logged it - and it is the single
 * place that writes the 500 response back to the client. Internals are not
 * leaked to callers in production.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter<unknown> {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const correlationId = resolveCorrelationId(request, response);
    const normalized = this.normalize(exception);
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger.error(
      {
        event: 'http.exception.unhandled',
        message: normalized.message,
        statusCode: status,
        method: request.method,
        path: getRequestPath(request),
        exceptionName: normalized.name,
        ...(correlationId ? { correlationId } : {}),
      },
      normalized.stack,
      AllExceptionsFilter.name,
    );

    const body: ErrorResponseBody = {
      statusCode: status,
      error: 'Internal Server Error',
      message: isProduction ? 'Internal server error' : normalized.message,
      path: getRequestPath(request),
      method: request.method,
      timestamp: new Date().toISOString(),
      ...(correlationId ? { correlationId } : {}),
    };

    response.status(status).json(body);
  }

  private normalize(exception: unknown): NormalizedException {
    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      };
    }

    if (typeof exception === 'string') {
      return { name: 'Error', message: exception };
    }

    return { name: 'Error', message: this.stringify(exception) };
  }

  private stringify(exception: unknown): string {
    try {
      return JSON.stringify(exception) ?? String(exception);
    } catch {
      return String(exception);
    }
  }
}
