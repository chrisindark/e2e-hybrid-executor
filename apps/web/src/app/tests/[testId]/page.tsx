'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { useResource } from '@/hooks/use-resource';
import { api, type TestWithSteps } from '@/lib/api';
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  ErrorState,
} from '@/components/states';

import { StepList } from '@/components/step-list';
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
import { useRouter } from 'next/navigation';

export default function TestDetailPage() {
  const params = useParams<{ testId: string }>();
  const testId = params?.testId ?? '';
  const router = useRouter();

  const {
    data: test,
    error,
    loading,
    reload,
  } = useResource<TestWithSteps | null>(() => api.getTest(testId), {
    deps: [testId],
    pollMs: 30000,
  });

  const sortedSteps = useMemo(
    () => (test ? [...test.steps].sort((a, b) => a.order - b.order) : []),
    [test],
  );

  if (loading && !test) {
    return <LoadingBlock rows={4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (!test) {
    return (
      <EmptyState
        title="Test not found"
        description="This test may have been removed, or the link is wrong."
        action={
          <Button render={<Link href="/tests" />}>Back to all tests</Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/tests" />}>
              Tests
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{test.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        eyebrow="Test definition"
        title={test.name}
        description={test.originalIntent}
        actions={
          <>
            <Button variant="outline" render={<Link href="/tests" />}>
              <ArrowLeft className="size-4" />
              All tests
            </Button>
            <RunTestDialog
              testId={test.testId}
              testName={test.name}
              onStarted={(runId) => router.push(`/runs/${runId}`)}
            />
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Target: {test.targetUrl}</span>
          <span>Version: {test.currentVersionId?.slice(0, 8) ?? '—'}…</span>
          <span>{sortedSteps.length} steps</span>
        </div>
      </PageHeader>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">What this test checks</h2>
        <p className="text-sm text-muted-foreground">
          Read top to bottom — these are the exact steps the runner will
          perform.
        </p>
        <StepList steps={sortedSteps} testId={test.testId} />
      </div>
    </div>
  );
}
