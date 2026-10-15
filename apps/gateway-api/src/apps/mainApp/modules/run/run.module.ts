import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Run } from '../../../../shared/run.entity';
import { RunController } from './run.controller';
import { RunService } from './run.service';

@Module({
  imports: [TypeOrmModule.forFeature([Run])],
  controllers: [RunController],
  providers: [RunService],
  exports: [TypeOrmModule, RunService],
})
export class RunModule {}
