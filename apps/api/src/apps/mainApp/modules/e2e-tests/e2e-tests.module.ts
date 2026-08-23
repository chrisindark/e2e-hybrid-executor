import { Module } from '@nestjs/common';

import { TestStoreModule } from '../test-store/test-store.module';
import { GenerationController } from './e2e-tests.controller';
import { GenerationService } from './e2e-tests.service';

@Module({
  imports: [TestStoreModule],
  controllers: [GenerationController],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
