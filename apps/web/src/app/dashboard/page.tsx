'use client';

import Link from 'next/link';

import { useResource } from '@/hooks/use-resource';
import { api, sortByStartedDesc } from '@/lib/api';
import { EmptyState, PageHeader } from '@/components/states';
import {
  MetricCard,
  METRIC_ICONS,
  PassRate,
  StatusBar,
} from '@/components/metric-card';
import { TestCardGrid } from '@/components/test-card';
import { RunRowList } from '@/components/run-row';
import { countRunsByStatus } from '@/lib/summary';
import { pluralize } from '@/lib/format';
import { Activity, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: tests } = useResource(() => api.listTests(), { pollMs: 30000 });
  const { data: promotions } = useResource(() => api.listPromotions(), {
    pollMs: 30000,
  });
  const pendingPromotions = (promotions ?? []).filter(
    (item) => item.status === 'pending',
  ).length;
  const { data: runs } = useResource(() => api.listRuns(), {
    pollMs: 10000,
    shouldPoll: (value) =>
      (value ?? []).some(
        (run) =>
          run.overallStatus === 'queued' ||
          run.overallStatus === 'pending' ||
          run.overallStatus === 'running',
      ),
  });

  const runList = runs ?? [];
  const counts = countRunsByStatus(runList);
  const latestRuns = sortByStartedDesc(runList).slice(0, 5);
  const testsList = (tests ?? []).slice(0, 6);

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
        eyebrow="Overview"
        title="Dashboard"
        description="What is green, what broke, and what needs your review — in plain English."
        actions={
          <Button render={<Link href="/intent" />}>
            <FlaskConical className="size-4" />
            Describe a test
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tests"
          value={tests?.length ?? 0}
          hint="saved in your library"
          icon={FlaskConical}
          tone="neutral"
          href="/tests"
        />
        <MetricCard
          label="Passed runs"
          value={counts.passed}
          hint={pluralize(counts.passed, 'run')}
          icon={METRIC_ICONS.green}
          tone="success"
          href="/runs"
        />
        <MetricCard
          label="Failed runs"
          value={counts.failed}
          hint="need attention"
          icon={METRIC_ICONS.failed}
          tone={counts.failed > 0 ? 'danger' : 'neutral'}
          href="/runs"
        />
        <MetricCard
          label="Still running"
          value={counts.inFlight}
          hint="updates live"
          icon={METRIC_ICONS.inFlight}
          tone="progress"
          href="/runs"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Run results</p>
            <p className="text-xs text-muted-foreground">
              {counts.total} total runs
            </p>
          </div>
          {counts.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              No runs yet — open a test and press “Run this test”.
            </p>
          ) : (
            <>
              <StatusBar segments={segments} total={counts.total} />
              <PassRate
                passed={counts.passed + counts.recovered}
                total={counts.total}
              />
            </>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Needs review</p>
          <p className="text-3xl font-semibold tabular-nums">
            {pendingPromotions}
          </p>
          <p className="text-xs text-muted-foreground">
            Suggested fixes waiting for a decision live on the review page.
          </p>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/promotions" />}
          >
            <Activity className="size-3.5" />
            Open suggested fixes
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest runs</h2>
          <Link
            href="/runs"
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            See all
          </Link>
        </div>
        {latestRuns.length > 0 ? (
          <RunRowList runs={latestRuns} />
        ) : (
          <EmptyState
            title="No runs yet"
            description="Start a run from a saved test to populate this list."
          />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Your tests ({tests?.length ?? 0})
          </h2>
          <Link
            href="/tests"
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            See all
          </Link>
        </div>
        {testsList.length > 0 ? (
          <TestCardGrid tests={testsList} />
        ) : (
          <EmptyState
            title="No tests yet"
            description="Describe a test in plain English to create your first one."
            action={
              <Button render={<Link href="/intent" />}>
                <FlaskConical className="size-4" />
                Describe a test
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
