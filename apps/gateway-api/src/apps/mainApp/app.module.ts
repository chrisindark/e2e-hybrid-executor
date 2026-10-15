import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from 'src/database/database.module';
import { TenantRepositoriesModule } from 'src/database/tenant-repositories.module';
import { TenantScopeInterceptor } from 'src/database/tenant-scope.interceptor';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

import { TenantContextMiddleware } from '../../common/middleware/tenant-context.middleware';
import configuration from '../../config/configuration';
import { CorrelationIdMiddleware } from '../../middlewares/correlation-id.middleware';
import { RequestLoggingMiddleware } from '../../middlewares/request-logging.middleware';
import { AgenticExecutionModule } from './modules/agentic-execution/agentic-execution.module';
import { AuthModule } from './modules/auth/auth.module';
import { GenerationModule } from './modules/e2e-tests/e2e-tests.module';
import { ExecutionModule } from './modules/execution/execution.module';
import { HealthModule } from './modules/health/health.module';
import { IntentModule } from './modules/intent/intent.module';
import { PingModule } from './modules/ping/ping.module';
import { PromotionCandidateModule } from './modules/promotion-candidate/promotion-candidate.module';
import { RunModule } from './modules/run/run.module';
import { TraceEventModule } from './modules/trace-event/trace-event.module';
import { AsyncLocalStorageModule } from './modules/utils/async-local-storage/async-local-storage.module';
import { GeminiModule } from './modules/utils/gemini/gemini.module';
import { OpenAIModule } from './modules/utils/open-ai/open-ai.module';
import { getEnvFilePath } from './modules/utils/utils.helper';
import { UtilsModule } from './modules/utils/utils.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: getEnvFilePath(),
      load: [configuration],
    }),
    AsyncLocalStorageModule,
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
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantScopeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CorrelationIdMiddleware must run before TenantContextMiddleware so the
    // tenant context's traceId can reuse the generated/forwarded correlation id.
    consumer.apply(CorrelationIdMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
    consumer.apply(TenantContextMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
    consumer.apply(RequestLoggingMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
