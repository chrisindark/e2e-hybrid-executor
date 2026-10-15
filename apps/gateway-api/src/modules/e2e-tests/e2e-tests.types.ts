import type { TestAction } from '../../shared/types';

/**
 * Transport-agnostic shapes for the generation service. The HTTP DTOs in
 * `apps/mainApp/dto` implement these; the service never imports class-validator
 * or anything from the HTTP entry point.
 */
export interface E2eTestStepInput {
  stepId?: string;
  order: number;
  description: string;
  action: TestAction;
  selector: string;
  value?: string;
  expectedOutcome: string;
}

export interface CreateE2eTestInput {
  name: string;
  originalIntent: string;
  targetUrl: string;
  steps: E2eTestStepInput[];
}

export interface UpdateTestDefinitionInput {
  name?: string;
  originalIntent?: string;
  targetUrl?: string;
}

export interface UpdateE2eTestStepInput {
  stepId: string;
  description?: string;
  action?: TestAction;
  selector?: string;
  value?: string;
  expectedOutcome?: string;
  order?: number;
}

export interface UpdateE2eTestInput {
  testDefinition?: UpdateTestDefinitionInput;
  steps?: E2eTestStepInput[];
  step?: UpdateE2eTestStepInput;
}
