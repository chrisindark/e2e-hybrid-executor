import { mockRepository } from 'test/helpers/mock-factory';
import type { Repository } from 'typeorm';
import type { TraceEvent } from '../../../../shared/trace-event.entity';

export const mockTraceEventRepository = () =>
  mockRepository() as unknown as Repository<TraceEvent>;
