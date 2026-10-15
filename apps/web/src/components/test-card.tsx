'use client';

import { Layers, PlayCircle, TestTube2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatRelative } from '@/lib/format';
import { isRunInFlight } from '@/lib/api';
import type { TestWithSteps } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * One saved test, summarised as a card. Shows what is tested (intent + target),
 * how many steps it has, and a link to run it and inspect its history. Built so
 * a non-technical reader can scan the library and find the right test.
 */
export function TestCard({ test }: { test: TestWithSteps }) {
  return (
    <Card className="group h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">
              <Link
                href={`/tests/${test.testId}`}
                className="hover:underline decoration-dotted underline-offset-4"
              >
                {test.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {test.originalIntent ||
                'No plain-English description was recorded for this test.'}
            </CardDescription>
          </div>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
            <TestTube2 className="size-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3.5" />
            {test.steps.length} step{test.steps.length === 1 ? '' : 's'}
          </span>
          <span
            className="inline-flex items-center gap-1 truncate max-w-[240px]"
            title={test.targetUrl}
          >
            {test.targetUrl}
          </span>
          <span>Updated {formatRelative(test.updatedAt)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" render={<Link href={`/tests/${test.testId}`} />}>
            <PlayCircle className="size-3.5" />
            Open &amp; run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TestCardGrid({ tests }: { tests: TestWithSteps[] }) {
  if (tests.length === 0) return null;

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3')}>
      {tests.map((test) => (
        <TestCard key={test.testId} test={test} />
      ))}
    </div>
  );
}

// Re-export helper to keep existing in-flight bundle small.
export { isRunInFlight };
