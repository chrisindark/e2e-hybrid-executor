'use client';

import Link from 'next/link';

import { useResource } from '@/hooks/use-resource';
import { api, sortByStartedDesc, sortEventsAscending } from '@/lib/api';
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  ErrorState,
} from '@/components/states';
import { TraceTimeline } from '@/components/trace-timeline';
import { StatusBadge } from '@/components/status-badge';
import { countEvents } from '@/lib/summary';
import { formatDateTime } from '@/lib/format';

export default function TracesPage() {
  const { data, error, loading, reload } = useResource(() => api.listRuns(), {
    pollMs: 15000,
    shouldPoll: (runs) =>
      (runs ?? []).some(
        (run) =>
          run.overallStatus === 'queued' ||
          run.overallStatus === 'pending' ||
          run.overallStatus === 'running',
      ),
  });

  const runs = sortByStartedDesc(data ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Execution"
        title="Traces"
        description="The step-by-step diary of every run. Each entry says what the test tried to do, whether it worked, what broke, and how it was fixed."
      />

      {loading && !data ? <LoadingBlock rows={3} /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && runs.length === 0 ? (
        <EmptyState
          title="No traces yet"
          description="Run a test to produce the first trace."
          action={
            <Link
              href="/tests"
              className="inline-flex items-center gap-1 text-sm underline"
            >
              Go to tests
            </Link>
          }
        />
      ) : null}

      <div className="space-y-8">
        {runs.map((run) => {
          const events = sortEventsAscending(run.events ?? []);
          const counts = countEvents(events);
          return (
            <section
              key={run.runId}
              className="space-y-3 rounded-2xl border border-border bg-card/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-medium">Run {run.runId.slice(0, 8)}…</p>
                  <p className="text-xs text-muted-foreground">
                    Started {formatDateTime(run.startedAt)} · {counts.total}{' '}
                    steps
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={run.overallStatus}
                    kind="run"
                    showMeaning
                  />
                  <Link
                    href={`/runs/${run.runId}`}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Open full trace
                  </Link>
                </div>
              </div>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No events recorded yet.
                </p>
              ) : (
                <TraceTimeline events={events} steps={[]} />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
