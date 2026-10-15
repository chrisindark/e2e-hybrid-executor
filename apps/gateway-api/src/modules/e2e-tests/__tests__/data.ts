import type { CreateE2eTestInput, UpdateE2eTestInput } from '../e2e-tests.types';

export const buildCreateE2eTestInput = (
  overrides: Partial<CreateE2eTestInput> = {},
): CreateE2eTestInput => ({
  name: 'Checkout Flow',
  originalIntent: 'Test the checkout flow',
  targetUrl: 'https://www.saucedemo.com',
  steps: [
    {
      order: 1,
      description: 'Go to login page',
      action: 'goto',
      value: 'https://www.saucedemo.com',
      expectedOutcome: 'Login page visible',
    },
  ],
  ...overrides,
} as CreateE2eTestInput);

export const buildUpdateE2eTestInput = (
  overrides: Partial<UpdateE2eTestInput> = {},
): UpdateE2eTestInput =>
  ({
    testDefinition: { name: 'Updated Name' },
    ...overrides,
  }) as UpdateE2eTestInput;
