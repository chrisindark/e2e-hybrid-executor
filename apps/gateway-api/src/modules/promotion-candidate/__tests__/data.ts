import {
  PromotionCandidate,
  PromotionCandidateStatus,
} from '../../../shared/promotion-candidate.entity';
import { TestStep } from '../../../shared/test-step.entity';
import type { CreatePromotionCandidateInput } from '../promotion-candidate.types';

export const buildPromotionCandidate = (
  overrides: Partial<PromotionCandidate> = {},
): PromotionCandidate =>
  ({
    promotionCandidateId: 'promo-1',
    runId: 'run-1',
    testId: 'test-1',
    stepId: 'step-1',
    basedVersionId: 'version-1',
    originalStep: '{}',
    proposedStep: '{}',
    reasoning: 'Updated selector after UI change',
    status: PromotionCandidateStatus.PENDING,
    decidedAt: null,
    createdVersionId: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  }) as PromotionCandidate;

export const buildCreatePromotionCandidateInput = (
  overrides: Partial<CreatePromotionCandidateInput> = {},
): CreatePromotionCandidateInput => ({
  runId: 'run-1',
  testId: 'test-1',
  stepId: 'step-1',
  basedVersionId: 'version-1',
  originalStep: {} as TestStep,
  proposedStep: {} as TestStep,
  reasoning: 'Selector drifted',
  ...overrides,
});
