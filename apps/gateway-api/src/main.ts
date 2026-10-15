import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { HelmetOptions } from 'helmet';
import helmet from 'helmet';

import { AppModule } from './apps/mainApp/app.module';
import winstonLogger from './apps/mainApp/modules/utils/winston/logger';
import { AllExceptionsFilter, HttpExceptionFilter } from './common/filters';

async function bootstrap() {
  winstonLogger.debug?.(
    `NODE_ENV - ${process.env.NODE_ENV ?? 'development'}`,
    'Bootstrap',
  );

  try {
    const app = await NestFactory.create(AppModule, {
      logger: winstonLogger,
    });

    const hsts = {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    };

    const helmetConfig: HelmetOptions = {
      hsts: hsts,
      crossOriginResourcePolicy: { policy: 'same-site' },
    };

    app.use(helmet(helmetConfig));

    const corsOriginsRaw =
      app.get(ConfigService).get<string>('CORS_ORIGIN_WHITELIST') ?? '';
    const corsOrigins = corsOriginsRaw
      ? corsOriginsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const corsMethodsRaw = app
      .get(ConfigService)
      .get<string>('CORS_ALLOW_METHODS');
    const corsMethods = corsMethodsRaw
      ? corsMethodsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    app.enableCors({
      origin: corsOrigins,
      methods: corsMethods,
      credentials: true,
      maxAge: 3600,
    });

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: ['1'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    // Order matters: Nest reverses the global filter list before matching
    // (see RouterExceptionFilters#setCustomFilters), so the *last* registered
    // filter is considered first. Register the catch-all first and the
    // HttpException filter last so real HTTP exceptions keep their own status
    // (401/400/...) and only unhandled errors fall through to the 500 handler.
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
    app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

    const rawPort =
      app.get(ConfigService).get<string | number>('APP_PORT') ?? 8000;
    const port = Number(rawPort);

    const rawAddress =
      app.get(ConfigService).get<string>('APP_ADDRESS') ?? '0.0.0.0';
    const address = String(rawAddress);

    await app.listen(port, address);

    winstonLogger.log(
      `API listening on http://${address}:${port}`,
      'Bootstrap',
    );
  } catch (e) {
    winstonLogger.error(
      e instanceof Error ? e : new Error(String(e)),
      undefined,
      'Bootstrap',
    );
  }
}
void bootstrap();
