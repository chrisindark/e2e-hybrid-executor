import { ExecutionMode, StepStatus, TraceEvent } from '../../../shared/trace-event.entity';

export const buildTraceEvent = (overrides: Partial<TraceEvent> = {}): TraceEvent => ({
  eventId: 'event-1',
  runId: 'run-1',
  stepId: 'step-1',
  mode: ExecutionMode.DETERMINISTIC,
  status: StepStatus.PASSED,
  durationMs: 150,
  actionTaken: 'click on "#login-button"',
  customerExplanation: 'Step completed as scripted',
  timestamp: new Date('2025-01-01T00:00:00Z'),
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
});

export const buildTraceEventList = (count = 3): TraceEvent[] =>
  Array.from({ length: count }, (_, i) =>
    buildTraceEvent({ eventId: `event-${i + 1}`, stepId: `step-${i + 1}` }),
  );
