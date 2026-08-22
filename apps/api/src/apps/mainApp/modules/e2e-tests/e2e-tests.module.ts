import { Module } from '@nestjs/common';

import { TestStoreModule } from '../test-store/test-store.module';
import { E2eTestsController } from './e2e-tests.controller';
import { E2eTestsService } from './e2e-tests.service';

@Module({
  imports: [TestStoreModule],
  controllers: [E2eTestsController],
  providers: [E2eTestsService],
  exports: [E2eTestsService],
})
export class E2eTestsModule {}
