'use client';

import { useResource } from '@/hooks/use-resource';
import { api, type TestWithSteps } from '@/lib/api';
import { EmptyState } from '@/components/states';
import { LoadingBlock } from '@/components/states';
import { PageHeader } from '@/components/states';
import { ErrorState } from '@/components/states';
import { TestCardGrid } from '@/components/test-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';

export default function TestsPage() {
  const { data, error, loading, reload } = useResource<TestWithSteps[]>(
    () => api.listTests(),
    {
      pollMs: 30000,
    },
  );

  const tests = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tests"
        title="All saved tests"
        description="Every test you have created. Open one to see exactly what it checks, then run it and read the trace."
        actions={
          <Button render={<Link href="/intent" />}>
            <FlaskConical className="size-4" />
            Describe a new test
          </Button>
        }
      />

      {loading && !data ? <LoadingBlock rows={3} /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && tests.length === 0 ? (
        <EmptyState
          title="No tests yet"
          description="Generate your first test from a plain-English sentence and we will save it here."
          action={
            <Button render={<Link href="/intent" />}>
              <FlaskConical className="size-4" />
              Describe a test
            </Button>
          }
        />
      ) : null}
      {tests.length > 0 ? <TestCardGrid tests={tests} /> : null}
    </div>
  );
}
