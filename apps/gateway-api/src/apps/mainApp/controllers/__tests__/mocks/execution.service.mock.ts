import { createMock } from 'test/helpers/mock-factory';
import type { ExecutionService } from '../../../../../modules/execution/execution.service';

export const mockExecutionService = () => createMock<ExecutionService>();
