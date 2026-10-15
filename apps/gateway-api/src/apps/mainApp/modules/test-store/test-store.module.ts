import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TestDefinition } from '../../../../shared/test-definition.entity';
import { TestStep } from '../../../../shared/test-step.entity';
import { TestVersion } from '../../../../shared/test-version.entity';
import { TestStoreService } from './test-store.service';

@Module({
  imports: [TypeOrmModule.forFeature([TestDefinition, TestStep, TestVersion])],
  providers: [TestStoreService],
  exports: [TypeOrmModule, TestStoreService],
})
export class TestStoreModule {}
