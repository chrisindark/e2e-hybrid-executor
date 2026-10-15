import { mockRepository } from 'test/helpers/mock-factory';
import type { Repository } from 'typeorm';
import type { TestStep } from '../../../../shared/test-step.entity';

export const mockTestStepRepository = () =>
  mockRepository() as unknown as Repository<TestStep>;
