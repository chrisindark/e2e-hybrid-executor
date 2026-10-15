import { Module } from '@nestjs/common';

import { TestStoreModule } from '../test-store/test-store.module';
import { GenerationService } from './e2e-tests.service';

@Module({
  imports: [TestStoreModule],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
