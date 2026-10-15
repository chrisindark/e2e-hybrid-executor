import { mockRepository } from 'test/helpers/mock-factory';
import type { Repository } from 'typeorm';
import type { TestVersion } from '../../../../shared/test-version.entity';

export const mockTestVersionRepository = () =>
  mockRepository() as unknown as Repository<TestVersion>;
