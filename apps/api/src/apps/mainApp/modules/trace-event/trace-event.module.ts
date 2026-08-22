import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TraceEvent } from '../../../../shared/trace-event.entity';
import { TraceEventService } from './trace-event.service';

@Module({
  imports: [TypeOrmModule.forFeature([TraceEvent])],
  providers: [TraceEventService],
  exports: [TypeOrmModule, TraceEventService],
})
export class TraceEventModule {}
