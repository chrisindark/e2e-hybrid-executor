import { Module } from '@nestjs/common';

import { TestStoreModule } from '../test-store/test-store.module';
import { PromotionCandidateService } from './promotion-candidate.service';

@Module({
  imports: [TestStoreModule],
  providers: [PromotionCandidateService],
  exports: [PromotionCandidateService],
})
export class PromotionCandidateModule {}
