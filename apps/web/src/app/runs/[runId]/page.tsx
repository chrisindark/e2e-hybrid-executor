'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import { useResource } from '@/hooks/use-resource';
import { api, sortEventsAscending } from '@/lib/api';
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  ErrorState,
} from '@/components/states';
import { StatusBadge } from '@/components/status-badge';
import { TraceTimeline } from '@/components/trace-timeline';
import { RunTestDialog } from '@/components/run-test-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { formatDateTime, formatDuration, runDurationMs } from '@/lib/format';
import { countEvents } from '@/lib/summary';
import { runStory } from '@/lib/summary';
import { isRunInFlight } from '@/lib/api';

export default function RunDetailPage() {
  const params = useParams<{ runId: string }>();
  const runId = params?.runId ?? '';
  const router = useRouter();

  const { data, error, loading, reload } = useResource(
    async () => {
      const detail = await api.getRunWithEvents(runId);
      return detail;
    },
    {
      deps: [runId],
      pollMs: 4000,
      shouldPoll: (detail) =>
        isRunInFlight(
          detail?.run as { overallStatus: import('@/lib/types').RunStatus },
        ),
    },
  );

  const run = data?.run ?? null;
  const events = sortEventsAscending(data?.events ?? []);
  const testPromise = useResource(
    () => (run?.testId ? api.getTest(run.testId) : Promise.resolve(null)),
    { deps: [run?.testId], enabled: !!run?.testId, pollMs: 60000 },
  );
  const test = testPromise.data;

  const promotionsPromise = useResource(() => api.listPromotions(), {
    pollMs: 30000,
  });
  const allPromotions = promotionsPromise.data ?? [];
  const runPromotions = allPromotions.filter((item) => item.runId === runId);

  if (loading && !run) return <LoadingBlock rows={3} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!run) {
    return (
      <EmptyState
        title="Run not found"
        description="This run may not exist, or the link is wrong."
        action={<Button render={<Link href="/runs" />}>Back to runs</Button>}
      />
    );
  }

  const counts = countEvents(events);
  const flight = isRunInFlight(run);
  const duration = runDurationMs(run);

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/runs" />}>Runs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Run {run.runId.slice(0, 8)}…</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        eyebrow="Run trace"
        title={test?.name ?? `Run ${run.runId.slice(0, 8)}…`}
        description={runStory(run, counts)}
        actions={
          <>
            <Button variant="outline" render={<Link href="/runs" />}>
              <ArrowLeft className="size-4" />
              All runs
            </Button>
            {test ? (
              <RunTestDialog
                testId={test.testId}
                testName={test.name}
                onStarted={(newRunId) => router.push(`/runs/${newRunId}`)}
              />
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <StatusBadge status={run.overallStatus} kind="run" showMeaning />
          <span>Started {formatDateTime(run.startedAt)}</span>
          {run.finishedAt ? (
            <span>Finished {formatDateTime(run.finishedAt)}</span>
          ) : null}
          {duration !== null ? (
            <span>Took {formatDuration(duration)}</span>
          ) : null}
          {flight ? (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <RefreshCw className="size-3.5 animate-spin" /> still running
            </span>
          ) : null}
        </div>
      </PageHeader>

      {run.error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="mb-1 text-sm font-medium text-red-200">
            Run-level error
          </p>
          <pre className="overflow-auto font-mono text-xs text-red-100/80 whitespace-pre-wrap break-words">
            {run.error}
          </pre>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Step-by-step trace
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({counts.passed} passed · {counts.recovered} recovered ·{' '}
            {counts.failed} failed)
          </span>
        </h2>
        {events.length === 0 ? (
          <EmptyState
            title="No trace events yet"
            description="The run has been accepted but steps have not started. This page refreshes on its own."
          />
        ) : (
          <TraceTimeline
            events={events}
            steps={test?.steps ?? []}
            promotions={runPromotions}
          />
        )}
      </div>

      {runPromotions.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Suggested fixes from this run
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {runPromotions.map((candidate) => (
              <PromotionLink
                key={candidate.promotionCandidateId}
                candidate={candidate}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { PromotionCard } from '@/components/promotion-card';

function PromotionLink({
  candidate,
}: {
  candidate: import('@/lib/types').DecidedPromotionCandidate;
}) {
  return <PromotionCard candidate={candidate} compact />;
}
