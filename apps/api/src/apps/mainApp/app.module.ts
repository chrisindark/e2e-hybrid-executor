import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from '../../config/configuration';
import { CorrelationIdMiddleware } from '../../middlewares/correlation-id.middleware';
import { RequestLoggingMiddleware } from '../../middlewares/request-logging.middleware';
import { AgenticExecutionModule } from './modules/agentic-execution/agentic-execution.module';
import { GenerationModule } from './modules/e2e-tests/e2e-tests.module';
import { ExecutionModule } from './modules/execution/execution.module';
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
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'database.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UtilsModule,
    PingModule,
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
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
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
