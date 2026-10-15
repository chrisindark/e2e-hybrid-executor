import { mockRepository } from 'test/helpers/mock-factory';
import type { Repository } from 'typeorm';
import type { TestDefinition } from '../../../../shared/test-definition.entity';

export const mockTestDefinitionRepository = () =>
  mockRepository() as unknown as Repository<TestDefinition>;
