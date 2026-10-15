import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { ErrorResponseBody } from './error-response.type';
import { getRequestPath, resolveCorrelationId } from './error-response.util';

interface NormalizedHttpError {
  message: string | string[];
  error: string;
}

/**
 * Global handler for every exception that extends Nest's {@link HttpException}
 * (the built-in 4xx/5xx exceptions plus anything raised by the `ValidationPipe`).
 *
 * The exception is *always* logged here, independently of any logging done in
 * controllers or services, and this filter is the single place that writes the
 * error response back to the client. 5xx are logged at `error` level (with the
 * stack) and 4xx at `warn` level so that real failures stay visible in logs
 * without drowning in expected client errors.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const correlationId = resolveCorrelationId(request, response);
    const { message, error } = this.normalize(exception);

    this.logException(exception, request, status, correlationId);

    const body: ErrorResponseBody = {
      statusCode: status,
      error,
      message,
      path: getRequestPath(request),
      method: request.method,
      timestamp: new Date().toISOString(),
      ...(correlationId ? { correlationId } : {}),
    };

    response.status(status).json(body);
  }

  /**
   * Nest allows an `HttpException` response to be a plain string or an object
   * that may or may not carry `message`/`error` fields. Normalize both shapes
   * into the fields of the standard error envelope.
   */
  private normalize(exception: HttpException): NormalizedHttpError {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse, error: exception.name };
    }

    const record = exceptionResponse as Record<string, unknown>;
    const rawMessage = record.message;
    const rawError = record.error;

    const message: string | string[] =
      typeof rawMessage === 'string' || Array.isArray(rawMessage)
        ? (rawMessage as string | string[])
        : exception.message;

    const error = typeof rawError === 'string' ? rawError : exception.name;

    return { message, error };
  }

  private logException(
    exception: HttpException,
    request: Request,
    status: number,
    correlationId: string,
  ): void {
    const payload = {
      event: 'http.exception',
      message: exception.message,
      statusCode: status,
      method: request.method,
      path: getRequestPath(request),
      exceptionName: exception.name,
      ...(correlationId ? { correlationId } : {}),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(payload, exception.stack, HttpExceptionFilter.name);

      return;
    }

    this.logger.warn(payload, HttpExceptionFilter.name);
  }
}
