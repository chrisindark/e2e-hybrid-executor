import { Module } from '@nestjs/common';

import { RunModule } from '../run/run.module';
import { TestRunModule } from '../test-run/test-run.module';
import { TraceEventModule } from '../trace-event/trace-event.module';
import { GeminiModule } from '../utils/gemini/gemini.module';
import { OpenAIModule } from '../utils/open-ai/open-ai.module';
import { ExecutionService } from './execution.service';

@Module({
  imports: [
    RunModule,
    TraceEventModule,
    TestRunModule,
    OpenAIModule,
    GeminiModule,
  ],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
