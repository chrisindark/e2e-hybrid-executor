import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PromotionCandidate } from '../../../../shared/promotion-candidate.entity';
import { TestStoreModule } from '../test-store/test-store.module';
import { PromotionCandidateController } from './promotion-candidate.controller';
import { PromotionCandidateService } from './promotion-candidate.service';

@Module({
  imports: [TypeOrmModule.forFeature([PromotionCandidate]), TestStoreModule],
  controllers: [PromotionCandidateController],
  providers: [PromotionCandidateService],
  exports: [PromotionCandidateService],
})
export class PromotionCandidateModule {}
