import { createMock } from 'test/helpers/mock-factory';
import type { PromotionCandidateService } from '../../../../../modules/promotion-candidate/promotion-candidate.service';

export const mockPromotionCandidateService = () =>
  createMock<PromotionCandidateService>();
