import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { HTTP_REQUESTS_SHOULD_NOT_LOG } from './middleware.constants';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const podName = process.env.HOSTNAME || 'unknown-pod';
    const startTime = performance.now();
    const requestUrl = (req['originalUrl'] || req.url) as string;

    const shouldNotLog = HTTP_REQUESTS_SHOULD_NOT_LOG.some((url: string) => {
      return requestUrl?.startsWith(url);
    });

    if (!shouldNotLog) {
      this.logger.log(
        `hostname: ${podName}, Incoming ${req.method} ${requestUrl}`,
      );
    }

    res.on('finish', () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!shouldNotLog) {
        this.logger.log(
          `hostname: ${podName}, Completed ${req.method} ${requestUrl} status=${res.statusCode} duration=${duration}ms`,
        );
      }
    });

    next();
  }
}
