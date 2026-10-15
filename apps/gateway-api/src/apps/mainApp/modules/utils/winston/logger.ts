import { hostname } from 'node:os';

import type { LoggerService } from '@nestjs/common';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { format, transports } from 'winston';

import { correlationIdFormat } from './correlation-id.format';
import { correlationPrinter } from './correlation-printer.format';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug');

/**
 * Human-readable output for local development.
 */
const prettyFormat = format.combine(
  correlationPrinter(),
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  format.ms(),
  format.errors({ stack: true }),
  nestWinstonModuleUtilities.format.nestLike('Nest', {
    colors: true,
    prettyPrint: true,
  }),
);

/**
 * One JSON object per line for production log aggregation
 * (Datadog, Loki, CloudWatch, etc.).
 */
const jsonFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
);

const winstonLogger: LoggerService = WinstonModule.createLogger({
  level: logLevel,
  exitOnError: false,
  defaultMeta: {
    service: process.env.APP_NAME ?? 'gateway-api',
    environment: process.env.NODE_ENV ?? 'development',
    hostname: process.env.HOSTNAME ?? hostname(),
  },
  transports: [
    new transports.Console({
      format: format.combine(
        correlationIdFormat(),
        isProduction ? jsonFormat : prettyFormat,
      ),
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});

export default winstonLogger;
