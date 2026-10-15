import { Module } from '@nestjs/common';

import { TestStoreService } from './test-store.service';

@Module({
  providers: [TestStoreService],
  exports: [TestStoreService],
})
export class TestStoreModule {}
