import { Module } from '@nestjs/common';

import { OpenAIModule } from '../utils/open-ai/open-ai.module';
import { IntentService } from './intent.service';

@Module({
  imports: [OpenAIModule],
  providers: [IntentService],
  exports: [IntentService],
})
export class IntentModule {}
