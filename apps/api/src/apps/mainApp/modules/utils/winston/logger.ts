import type { LoggerService } from '@nestjs/common';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { format, transports } from 'winston';

import { correlationIdFormat } from './correlation-id.format';
import { correlationPrinter } from './correlation-printer.format';

const winstonLogger: LoggerService = WinstonModule.createLogger({
  level: 'debug',
  exitOnError: false,
  transports: [
    new transports.Console({
      format: format.combine(
        correlationIdFormat(),
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
      ),
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});

export default winstonLogger;
