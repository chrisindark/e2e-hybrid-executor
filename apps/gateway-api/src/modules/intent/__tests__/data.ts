import { TestStep } from '../../../shared/test-step.entity';

export const buildGeneratedTest = (overrides: Record<string, unknown> = {}) => ({
  name: 'checkout flow',
  originalIntent: 'Test the checkout flow on saucedemo',
  targetUrl: 'https://www.saucedemo.com',
  steps: [
    {
      stepId: 'step-1',
      order: 1,
      description: 'Go to login page',
      action: 'goto',
      selector: '',
      value: 'https://www.saucedemo.com',
      expectedOutcome: 'Login page visible',
    },
  ] as TestStep[],
  ...overrides,
});
