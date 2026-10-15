'use client';

import { Terminal } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDateTime, formatDuration, runDurationMs } from '@/lib/format';
import { StatusBadge } from '@/components/status-badge';
import type { Run, RunWithEvents } from '@/lib/types';
import { isRunInFlight } from '@/lib/api';
import { countEvents } from '@/lib/summary';
import { TraceSummaryLine } from '@/components/trace-timeline';

/**
 * One row in the runs list: when it ran, its result, how many steps, and a
 * link to the full trace. Reusable by both /runs and embedded dashboards.
 */
export function RunRow({ run }: { run: RunWithEvents }) {
  const isFlight = isRunInFlight(run);
  const counts = countEvents(run.events ?? []);
  const duration = runDurationMs(run);

  return (
    <Link
      href={`/runs/${run.runId}`}
      className={cn(
        'grid gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-card/80 md:grid-cols-[auto_1fr_auto]',
        isFlight ? 'ring-1 ring-amber-500/30' : '',
      )}
    >
      <span className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted">
          <Terminal className="size-4 text-muted-foreground" />
        </span>
      </span>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Run {run.runId.slice(0, 8)}…</span>
          <StatusBadge status={run.overallStatus} kind="run" showMeaning />
          {isFlight ? (
            <span className="text-xs text-amber-300">still running…</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Started {formatDateTime(run.startedAt)}</span>
          <span>· {counts.total} steps</span>
          <span>
            · {counts.passed} passed · {counts.recovered} recovered ·{' '}
            {counts.failed} failed
          </span>
          {duration !== null ? (
            <span>· finished in {formatDuration(duration)}</span>
          ) : null}
        </div>
        {run.events?.length ? (
          <TraceSummaryLine events={run.events} className="opacity-90" />
        ) : null}
      </div>
      <span className="flex items-center justify-self-end text-xs text-muted-foreground">
        View trace <span className="ml-1">→</span>
      </span>
    </Link>
  );
}

export function RunRowList({ runs }: { runs: RunWithEvents[] }) {
  if (runs.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {runs.map((run) => (
        <RunRow key={run.runId} run={run} />
      ))}
    </div>
  );
}

export type { Run };
