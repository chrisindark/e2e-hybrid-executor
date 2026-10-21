'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  ErrorState,
} from '@/components/states';
import { StepCard } from '@/components/step-list';
import { Mono } from '@/components/bits';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

export default function StepHistoryPage() {
  const params = useParams<{ testId: string; stepId: string }>();
  const testId = params?.testId ?? '';
  const stepId = params?.stepId ?? '';

  const {
    data: test,
    error,
    loading,
    reload,
  } = useResource(() => api.getTest(testId), { deps: [testId], pollMs: 30000 });

  if (loading && !test) return <LoadingBlock rows={3} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const step = test?.steps.find((item) => item.stepId === stepId);

  if (!test || !step) {
    return (
      <EmptyState
        title="Step not found"
        description="This step may have been removed."
        action={
          <Button render={<Link href={`/tests/${testId}`} />}>
            Back to test
          </Button>
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
            <BreadcrumbLink render={<Link href={`/tests/${testId}`} />}>
              {test.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Step {step.order}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        eyebrow="Step history"
        title={step.description || `Step ${step.order}`}
        description="Permanent address for this step, so it can be linked from traces, promotions and code reviews."
        actions={
          <Button variant="outline" render={<Link href={`/tests/${testId}`} />}>
            <ArrowLeft className="size-4" />
            Back to test
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-medium">Current step</h3>
          <StepCard step={step} testId={testId} />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="font-medium">Identifiers</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Step id</dt>
              <dd>
                <Mono>{step.stepId}</Mono>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Test id</dt>
              <dd>
                <Mono>{testId}</Mono>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                Current test version
              </dt>
              <dd>
                <Mono>{test.currentVersionId ?? '—'}</Mono>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
