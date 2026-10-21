/**
 * Turning lists of runs and trace events into the small numbers the dashboard
 * and list views show. Keeping this in one place means the dashboard, the runs
 * list and the trace page never disagree about what "2 failing" means.
 */

import type { RunStatus, TraceEvent } from './types';

export interface EventCounts {
  passed: number;
  recovered: number;
  failed: number;
  running: number;
  pending: number;
  total: number;
}

/** Count trace events by the outcome a reader cares about. */
export function countEvents(events: TraceEvent[]): EventCounts {
  const counts: EventCounts = {
    passed: 0,
    recovered: 0,
    failed: 0,
    running: 0,
    pending: 0,
    total: events.length,
  };

  for (const event of events) {
    if (event.status === 'passed') counts.passed += 1;
    else if (event.status === 'recovered') counts.recovered += 1;
    else if (event.status === 'failed') counts.failed += 1;
    else if (event.status === 'running') counts.running += 1;
    else counts.pending += 1;
  }

  return counts;
}

export interface RunStatusCounts {
  passed: number;
  recovered: number;
  failed: number;
  inFlight: number;
  total: number;
}

/** Count runs by overall status. */
export function countRunsByStatus(
  runs: Array<{ overallStatus: RunStatus }>,
): RunStatusCounts {
  const counts: RunStatusCounts = {
    passed: 0,
    recovered: 0,
    failed: 0,
    inFlight: 0,
    total: runs.length,
  };

  for (const run of runs) {
    if (run.overallStatus === 'passed') counts.passed += 1;
    else if (run.overallStatus === 'recovered') counts.recovered += 1;
    else if (run.overallStatus === 'failed') counts.failed += 1;
    else counts.inFlight += 1;
  }

  return counts;
}

/**
 * A run is "green" when nothing is left broken. A recovered run counts as green
 * because the test passed in the end (even though it needed a fix).
 */
export function isGreen(status: RunStatus | string | null | undefined) {
  return status === 'passed' || status === 'recovered';
}

/**
 * The single-sentence "what happened" for a run, written for someone who does
 * not read code.
 */
export function runStory(
  run: {
    overallStatus: RunStatus;
    error?: string | null;
  },
  counts: EventCounts,
): string {
  switch (run.overallStatus) {
    case 'queued':
      return 'Accepted and waiting for a worker to pick it up.';
    case 'pending':
      return 'Being prepared — steps have not started yet.';
    case 'running':
      return 'Steps are running right now. This page refreshes on its own.';
    case 'passed':
      return `All ${counts.total} steps did exactly what the test expected.`;
    case 'recovered':
      return `${counts.recovered} step${counts.recovered === 1 ? '' : 's'} failed first, the system found a working alternative, and the test finished green.`;
    case 'failed': {
      if (counts.failed > 0) {
        return `${counts.failed} step${counts.failed === 1 ? '' : 's'} could not be completed and no working fix was found.`;
      }

      if (run.error) {
        return 'The run stopped before the steps could finish. Open the details to see the error.';
      }

      return 'The run ended without every step passing.';
    }
    default:
      return 'The result of this run is not yet known.';
  }
}
