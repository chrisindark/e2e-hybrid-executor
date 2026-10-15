import type { TestAction } from '../../../shared/types';
import { TestDefinition } from '../../../shared/test-definition.entity';
import { TestStep } from '../../../shared/test-step.entity';
import { TestVersion } from '../../../shared/test-version.entity';

export const buildTestDefinition = (overrides: Partial<TestDefinition> = {}): TestDefinition => ({
  testId: 'test-1',
  name: 'Checkout Flow',
  originalIntent: 'Test the checkout flow',
  targetUrl: 'https://saucedemo.com',
  currentVersionId: 'version-1',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
});

export const buildTestStep = (overrides: Partial<TestStep> = {}): TestStep => ({
  stepId: 'step-1',
  testId: 'test-1',
  order: 1,
  description: 'Navigate to login page',
  action: 'goto' as TestAction,
  selector: '',
  value: 'https://saucedemo.com',
  expectedOutcome: 'Login page is displayed',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
});

export const buildTestVersion = (overrides: Partial<TestVersion> = {}): TestVersion => ({
  versionId: 'version-1',
  testId: 'test-1',
  versionNumber: 1,
  definitionSnapshot: JSON.stringify({ name: 'Checkout Flow' }),
  stepsSnapshot: JSON.stringify([buildTestStep()]),
  parentVersionId: undefined,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
});

export const buildTestStore = () => ({
  testDefinition: buildTestDefinition(),
  testSteps: [buildTestStep()],
});
