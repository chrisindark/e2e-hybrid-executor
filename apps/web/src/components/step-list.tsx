'use client';

import {
  ArrowRight,
  CircleCheck,
  MousePointerClick,
  Quote,
  Search,
} from 'lucide-react';
import Link from 'next/link';

import { GlossaryHint } from '@/components/info-hint';
import { Mono } from '@/components/bits';
import { FadeIn } from '@/components/states';
import { Button } from '@/components/ui/button';
import { actionMeta } from '@/lib/status';
import { checkText, describeStep, isCheck } from '@/lib/steps';
import type { TestStep } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * The ordered list of steps a test performs. This is the "exactly what would be
 * tested" view: every step is restated in plain English, with the technical
 * selector available on demand.
 */
export function StepList({
  steps,
  testId,
  className,
}: {
  steps: TestStep[];
  testId: string;
  className?: string;
}) {
  const ordered = [...steps].sort((a, b) => a.order - b.order);

  return (
    <ol className={cn('space-y-2.5', className)}>
      {ordered.map((step, index) => (
        <li key={step.stepId}>
          <FadeIn delay={Math.min(index * 0.03, 0.24)}>
            <StepCard step={step} testId={testId} />
          </FadeIn>
        </li>
      ))}
    </ol>
  );
}

export function StepCard({ step, testId }: { step: TestStep; testId: string }) {
  const meta = actionMeta(step.action);

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-foreground/20">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono text-xs text-muted-foreground">
        {step.order}
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium">
            {isCheck(step) ? (
              <Search className="size-3" />
            ) : (
              <MousePointerClick className="size-3" />
            )}
            {meta.label}
          </span>
          {step.description ? (
            <span className="text-sm font-medium text-pretty">
              {step.description}
            </span>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground text-pretty">
          {describeStep(step)}
        </p>

        {isCheck(step) ? (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-2">
            <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
            <p className="text-xs text-muted-foreground">
              Passes when <Mono>{step.selector}</Mono> contains{' '}
              <span className="font-medium text-foreground">
                “{checkText(step)}”
              </span>
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-2">
            <Quote className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Should see: {step.expectedOutcome}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {step.selector ? (
            <span className="inline-flex items-center gap-1">
              <GlossaryHint term="selector" className="decoration-transparent">
                <span>finds</span>
              </GlossaryHint>
              <Mono>{step.selector}</Mono>
            </span>
          ) : null}
          {step.value && !isCheck(step) ? (
            <span className="inline-flex items-center gap-1">
              uses <Mono>{step.value}</Mono>
            </span>
          ) : null}
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        render={<Link href={`/tests/${testId}/steps/${step.stepId}`} />}
      >
        History
        <ArrowRight className="size-3.5" />
      </Button>
    </div>
  );
}
