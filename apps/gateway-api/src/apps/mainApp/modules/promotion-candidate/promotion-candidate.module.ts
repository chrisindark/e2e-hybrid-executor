import { Module } from '@nestjs/common';

import { TestStoreModule } from '../test-store/test-store.module';
import { PromotionCandidateController } from './promotion-candidate.controller';
import { PromotionCandidateService } from './promotion-candidate.service';

@Module({
  imports: [TestStoreModule],
  controllers: [PromotionCandidateController],
  providers: [PromotionCandidateService],
  exports: [PromotionCandidateService],
})
export class PromotionCandidateModule {}
