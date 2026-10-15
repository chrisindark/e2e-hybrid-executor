import { Module } from '@nestjs/common';

import { TestStoreModule } from '../test-store/test-store.module';
import { AgenticExecutionModule } from '../agentic-execution/agentic-execution.module';
import { PromotionCandidateModule } from '../promotion-candidate/promotion-candidate.module';
import { RunModule } from '../run/run.module';
import { TraceEventModule } from '../trace-event/trace-event.module';
import { TestRunService } from './test-run.service';

@Module({
  imports: [
    RunModule,
    TraceEventModule,
    TestStoreModule,
    AgenticExecutionModule,
    PromotionCandidateModule,
  ],
  providers: [TestRunService],
  exports: [TestRunService],
})
export class TestRunModule {}
