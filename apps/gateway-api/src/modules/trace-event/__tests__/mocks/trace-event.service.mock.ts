import { createMock } from 'test/helpers/mock-factory';
import type { TraceEventService } from '../../trace-event.service';

export const mockTraceEventService = () => createMock<TraceEventService>();
