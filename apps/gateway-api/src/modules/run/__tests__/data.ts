import { Run, RunStatus } from '../../../shared/run.entity';

export const buildRun = (overrides: Partial<Run> = {}): Run => ({
  runId: 'run-1',
  testId: 'test-1',
  versionId: 'version-1',
  overallStatus: RunStatus.PENDING,
  startedAt: new Date('2025-01-01T00:00:00Z'),
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
});

export const buildRunList = (count = 3): Run[] =>
  Array.from({ length: count }, (_, i) =>
    buildRun({
      runId: `run-${i + 1}`,
      overallStatus: RunStatus.PASSED,
    }),
  );
