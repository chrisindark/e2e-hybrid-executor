import { Module } from '@nestjs/common';

import { TraceEventService } from './trace-event.service';

@Module({
  providers: [TraceEventService],
  exports: [TraceEventService],
})
export class TraceEventModule {}
