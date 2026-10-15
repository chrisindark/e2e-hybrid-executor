import { mockRepository } from 'test/helpers/mock-factory';
import type { Repository } from 'typeorm';
import type { PromotionCandidate } from '../../../../shared/promotion-candidate.entity';

export const mockPromotionCandidateRepository = () =>
  mockRepository() as unknown as Repository<PromotionCandidate>;
