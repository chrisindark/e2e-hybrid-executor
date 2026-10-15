import { Module } from '@nestjs/common';

import { OpenAIService } from './open-ai.service';

@Module({
  imports: [],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
