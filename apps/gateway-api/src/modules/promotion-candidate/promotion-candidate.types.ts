import type { TestStep } from '../../shared/test-step.entity';

/**
 * Transport-agnostic input for recording a promotion candidate. The HTTP DTO
 * implements it, so the service stays independent of the HTTP entry point.
 */
export interface CreatePromotionCandidateInput {
  runId: string;
  testId: string;
  stepId: string;
  basedVersionId?: string;
  originalStep: TestStep;
  proposedStep: TestStep;
  reasoning: string;
}
