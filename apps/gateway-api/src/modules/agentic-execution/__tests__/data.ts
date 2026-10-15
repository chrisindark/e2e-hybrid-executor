import { StepStatus } from '../../../shared/trace-event.entity';
import type { TestAction } from '../../../shared/types';
import type {
  AgenticPrimaryActionResult,
  AgenticPrimaryRunResult,
  RecoveryResult,
} from '../agentic-execution.service';

export const buildRecoveryResult = (
  overrides: Partial<RecoveryResult> = {},
): RecoveryResult => ({
  success: true,
  newStep: {
    stepId: 'step-1',
    testId: 'test-1',
    order: 1,
    description: 'Click login button',
    action: 'click' as TestAction,
    selector: '#login-button',
    value: '',
    expectedOutcome: 'Logged in',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  reasoning: 'Found the login button by ID',
  actionTaken: 'click on "#login-button"',
  validationStatus: 'PASSED',
  ...overrides,
});

export const buildAgenticPrimaryActionResult = (
  overrides: Partial<AgenticPrimaryActionResult> = {},
): AgenticPrimaryActionResult => ({
  index: 1,
  action: 'click',
  selector: '#login-button',
  reasoning: 'Navigate to login',
  status: StepStatus.PASSED,
  durationMs: 200,
  customerExplanation: 'Clicked login button',
  ...overrides,
});

export const buildAgenticPrimaryRunResult = (
  overrides: Partial<AgenticPrimaryRunResult> = {},
): AgenticPrimaryRunResult => ({
  goalAchieved: true,
  actions: [buildAgenticPrimaryActionResult()],
  ...overrides,
});
