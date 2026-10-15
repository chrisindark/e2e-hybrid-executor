import { createMock } from 'test/helpers/mock-factory';
import type { ExecutionService } from '../../execution.service';

export const mockExecutionService = () => createMock<ExecutionService>();
