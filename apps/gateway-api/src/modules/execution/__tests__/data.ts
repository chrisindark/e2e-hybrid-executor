import { ExecutionMode } from '../../../shared/trace-event.entity';
import type { RunOptions } from '../execution.types';

export const buildRunOptions = (overrides: Partial<RunOptions> = {}): RunOptions => ({
  mode: ExecutionMode.DETERMINISTIC,
  ...overrides,
});

export const buildQueuedRunResponse = (runId = 'run-1') => ({
  runId,
  status: 'QUEUED' as const,
});
