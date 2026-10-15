import { createMock } from 'test/helpers/mock-factory';
import type { PromotionCandidateService } from '../../promotion-candidate.service';

export const mockPromotionCandidateService = () =>
  createMock<PromotionCandidateService>();
