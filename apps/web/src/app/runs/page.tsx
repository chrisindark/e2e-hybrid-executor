'use client';

import Link from 'next/link';

import { useResource } from '@/hooks/use-resource';
import { api, sortByStartedDesc } from '@/lib/api';
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  ErrorState,
} from '@/components/states';
import { RunRowList } from '@/components/run-row';
import { countRunsByStatus } from '@/lib/summary';
import { StatusBar } from '@/components/metric-card';

import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RunsPage() {
  const { data, error, loading, reload } = useResource(() => api.listRuns(), {
    pollMs: 5000,
    shouldPoll: (runs) =>
      (runs ?? []).some(
        (run) =>
          run.overallStatus === 'queued' ||
          run.overallStatus === 'pending' ||
          run.overallStatus === 'running',
      ),
  });

  const runs = sortByStartedDesc(data ?? []);
  const counts = countRunsByStatus(runs);

  const segments = [
    {
      key: 'passed',
      label: 'Passed',
      count: counts.passed,
      tone: 'success' as const,
    },
    {
      key: 'recovered',
      label: 'Passed after a fix',
      count: counts.recovered,
      tone: 'info' as const,
    },
    {
      key: 'failed',
      label: 'Failed',
      count: counts.failed,
      tone: 'danger' as const,
    },
    {
      key: 'inFlight',
      label: 'Still running',
      count: counts.inFlight,
      tone: 'progress' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Execution"
        title="Runs"
        description="Every time a test was executed. Open a run to read the step-by-step trace: what broke, what fixed it, and how it ended."
      />

      {counts.total > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Overall results</p>
            <p className="text-xs text-muted-foreground">
              {counts.total} runs total
            </p>
          </div>
          <StatusBar segments={segments} total={counts.total} />
        </div>
      ) : null}

      {loading && !data ? <LoadingBlock rows={4} /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && runs.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="Open a saved test and press “Run this test” to create the first run."
          action={
            <Button render={<Link href="/tests" />}>
              <PlayCircle className="size-4" />
              Go to tests
            </Button>
          }
        />
      ) : null}
      {runs.length > 0 ? <RunRowList runs={runs} /> : null}
    </div>
  );
}
