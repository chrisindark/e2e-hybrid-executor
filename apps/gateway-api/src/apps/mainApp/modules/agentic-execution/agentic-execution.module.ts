import { Module } from '@nestjs/common';

import { GeminiModule } from '../utils/gemini/gemini.module';
import { OpenAIModule } from '../utils/open-ai/open-ai.module';
import { AgenticExecutionService } from './agentic-execution.service';

@Module({
  imports: [OpenAIModule, GeminiModule],
  providers: [AgenticExecutionService],
  exports: [AgenticExecutionService],
})
export class AgenticExecutionModule {}
