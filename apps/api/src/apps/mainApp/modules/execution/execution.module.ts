import { Module } from '@nestjs/common';

import { RunModule } from '../run/run.module';
import { TestRunModule } from '../test-run/test-run.module';
import { TraceEventModule } from '../trace-event/trace-event.module';
import { OpenAIModule } from '../utils/open-ai/open-ai.module';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';

@Module({
  imports: [RunModule, TraceEventModule, TestRunModule, OpenAIModule],
  controllers: [ExecutionController],
  providers: [ExecutionService],
})
export class ExecutionModule {}
