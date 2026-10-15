import { createMock } from 'test/helpers/mock-factory';
import type { AgenticExecutionService } from '../../agentic-execution.service';

export const mockAgenticExecutionService = () =>
  createMock<AgenticExecutionService>();
