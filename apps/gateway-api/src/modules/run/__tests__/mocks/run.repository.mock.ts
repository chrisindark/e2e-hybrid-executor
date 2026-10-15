import { mockRepository } from 'test/helpers/mock-factory';
import type { Repository } from 'typeorm';
import type { Run } from '../../../../shared/run.entity';

export const mockRunRepository = () => mockRepository() as unknown as Repository<Run>;
