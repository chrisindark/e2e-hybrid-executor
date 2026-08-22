import { Module } from '@nestjs/common';

import { OpenAIModule } from '../utils/open-ai/open-ai.module';
import { IntentController } from './intent.controller';
import { IntentService } from './intent.service';

@Module({
  imports: [OpenAIModule],
  controllers: [IntentController],
  providers: [IntentService],
  exports: [IntentService],
})
export class IntentModule {}
