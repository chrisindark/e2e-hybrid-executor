import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TestDefinition } from '../../../../shared/test-definition.entity';
import { TestStep } from '../../../../shared/test-step.entity';
import { TestStoreService } from './test-store.service';

@Module({
  imports: [TypeOrmModule.forFeature([TestDefinition, TestStep])],
  providers: [TestStoreService],
  exports: [TypeOrmModule, TestStoreService],
})
export class TestStoreModule {}
