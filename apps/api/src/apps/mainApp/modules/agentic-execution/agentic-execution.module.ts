import { Module } from '@nestjs/common';

import { OpenAIModule } from '../utils/open-ai/open-ai.module';
import { AgenticExecutionService } from './agentic-execution.service';

@Module({
  imports: [OpenAIModule],
  providers: [AgenticExecutionService],
  exports: [AgenticExecutionService],
})
export class AgenticExecutionModule {}
