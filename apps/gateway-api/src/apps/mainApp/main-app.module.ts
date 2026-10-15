import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import configuration from '../../config/configuration';
import { DatabaseModule } from '../../database/database.module';
import { TenantRepositoriesModule } from '../../database/tenant-repositories.module';
import { TenantScopeInterceptor } from '../../database/tenant-scope.interceptor';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CorrelationIdMiddleware } from '../../middlewares/correlation-id.middleware';
import { RequestLoggingMiddleware } from '../../middlewares/request-logging.middleware';
import { AgenticExecutionModule } from '../../modules/agentic-execution/agentic-execution.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { GenerationModule } from '../../modules/e2e-tests/e2e-tests.module';
import { ExecutionModule } from '../../modules/execution/execution.module';
import { HealthModule } from '../../modules/health/health.module';
import { IntentModule } from '../../modules/intent/intent.module';
import { PingModule } from '../../modules/ping/ping.module';
import { PromotionCandidateModule } from '../../modules/promotion-candidate/promotion-candidate.module';
import { RunModule } from '../../modules/run/run.module';
import { TraceEventModule } from '../../modules/trace-event/trace-event.module';
import { GeminiModule } from '../../modules/utils/gemini/gemini.module';
import { OpenAIModule } from '../../modules/utils/open-ai/open-ai.module';
import { getEnvFilePath } from '../../modules/utils/utils.helper';
import { UtilsModule } from '../../modules/utils/utils.module';
import { AuthController } from './controllers/auth.controller';
import { GenerationController } from './controllers/e2e-tests.controller';
import { ExecutionController } from './controllers/execution.controller';
import { HealthController } from './controllers/health.controller';
import { IntentController } from './controllers/intent.controller';
import { PingController } from './controllers/ping.controller';
import { PromotionCandidateController } from './controllers/promotion-candidate.controller';
import { RunController } from './controllers/run.controller';

/**
 * HTTP entry point: the public API. Transport-agnostic business logic lives in
 * `src/modules/*`; this module wires the controllers, middleware, guards and
 * filters that only make sense when a server is listening. Other entry points
 * (workers, cron, webhooks) compose the same domain modules without any of this.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: getEnvFilePath(),
      load: [configuration],
    }),
    UtilsModule,
    HealthModule,
    PingModule,
    AuthModule,
    DatabaseModule,
    TenantRepositoriesModule,
    IntentModule,
    GenerationModule,
    RunModule,
    TraceEventModule,
    OpenAIModule,
    GeminiModule,
    ExecutionModule,
    AgenticExecutionModule,
    PromotionCandidateModule,
  ],
  controllers: [
    HealthController,
    PingController,
    AuthController,
    IntentController,
    GenerationController,
    ExecutionController,
    RunController,
    PromotionCandidateController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantScopeInterceptor },
  ],
})
export class MainAppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CorrelationIdMiddleware establishes the telemetry `RequestContext` for the
    // request, so it must run before anything that reads it (logging, filters,
    // the auth guard). `RequestLoggingMiddleware` closes over that context.
    consumer.apply(CorrelationIdMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
    consumer.apply(RequestLoggingMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
