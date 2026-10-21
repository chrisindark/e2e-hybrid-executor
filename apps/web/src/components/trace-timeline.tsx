'use client';

import { AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Bug,
  CircleCheck,
  Clock,
  MousePointerClick,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  CopyButton,
  Disclosure,
  Field,
  Mono,
  RawBlock,
} from '@/components/bits';
import { FadeIn } from '@/components/states';
import { ModeBadge, StatusBadge, StatusIcon } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  formatDateTime,
  formatDuration,
  humanizeAction,
  pluralize,
} from '@/lib/format';
import { actionMeta, statusMeta, TONE_CLASSES } from '@/lib/status';
import type {
  DecidedPromotionCandidate,
  TestStep,
  TraceEvent,
} from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Renders the ordered trace events of a run as a timeline. Each entry answers,
 * in order: what did the test try to do, did it work, what broke if it didn't,
 * and what (if anything) fixed it.
 */
export function TraceTimeline({
  events,
  steps,
  promotions,
}: {
  events: TraceEvent[];
  steps: TestStep[];
  promotions?: DecidedPromotionCandidate[];
}) {
  const ordered = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <ol className="relative space-y-3 border-l border-border pl-6">
      <AnimatePresence initial={false}>
        {ordered.map((event, index) => (
          <li key={event.eventId} className="relative">
            <span className="absolute top-4 -left-[31px] flex size-6 items-center justify-center rounded-full border border-border bg-card">
              <StatusIcon
                status={event.status}
                className={cn(
                  event.status === 'running' && 'animate-spin',
                  TONE_CLASSES[statusMeta(event.status).tone].text,
                )}
              />
            </span>
            <FadeIn delay={Math.min(index * 0.04, 0.3)}>
              <TraceEventCard
                event={event}
                step={steps.find(
                  (candidate) => candidate.stepId === event.stepId,
                )}
                promotion={promotions?.find(
                  (candidate) =>
                    candidate.runId === event.runId &&
                    candidate.stepId === event.stepId,
                )}
                index={index}
              />
            </FadeIn>
          </li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

function TraceEventCard({
  event,
  step,
  promotion,
  index,
}: {
  event: TraceEvent;
  step?: TestStep;
  promotion?: DecidedPromotionCandidate;
  index: number;
}) {
  const failed = event.status === 'failed';
  const recovered = event.status === 'recovered';

  return (
    <Card className="gap-3 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              Step {(step?.order ?? index + 1).toString().padStart(2, '0')}
            </span>
            <StatusBadge status={event.status} showMeaning />
            <ModeBadge mode={event.mode} showMeaning />
          </div>
          <p className="text-sm font-medium text-pretty">
            {step?.description ?? event.actionTaken ?? 'Step'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          {formatDuration(event.durationMs)}
        </div>
      </div>

      <div className="space-y-3 px-4">
        <p
          className={cn(
            'text-sm text-pretty',
            failed ? 'text-foreground' : 'text-foreground/90',
          )}
        >
          {event.customerExplanation ||
            'No explanation was recorded for this step.'}
        </p>

        {step ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MousePointerClick className="size-3.5" />
              {actionMeta(step.action).label}
            </span>
            {step.selector ? (
              <>
                <span aria-hidden>·</span>
                <span>
                  looks for <Mono>{step.selector}</Mono>
                </span>
              </>
            ) : null}
            {step.expectedOutcome ? (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">
                  expects “{step.expectedOutcome}”
                </span>
              </>
            ) : null}
          </div>
        ) : null}

        {failed ? <FailurePanel event={event} promotion={promotion} /> : null}
        {recovered ? (
          <RecoveryPanel event={event} promotion={promotion} />
        ) : null}

        <Disclosure summary="Technical details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Action taken">
              {event.actionTaken ? (
                <Mono>{event.actionTaken}</Mono>
              ) : (
                <span>—</span>
              )}
            </Field>
            <Field label="Mode">
              <ModeBadge mode={event.mode} />
            </Field>
            <Field label="Recorded at">{formatDateTime(event.timestamp)}</Field>
            <Field label="Event id">
              <span className="inline-flex items-center gap-1.5">
                <Mono>{event.eventId.slice(0, 13)}…</Mono>
                <CopyButton value={event.eventId} label="Copy" />
              </span>
            </Field>
          </div>
          {event.error ? (
            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Raw error
              </p>
              <RawBlock>{event.error}</RawBlock>
            </div>
          ) : null}
          {event.reasoning ? (
            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Full AI reasoning
              </p>
              <RawBlock>{event.reasoning}</RawBlock>
            </div>
          ) : null}
        </Disclosure>
      </div>
    </Card>
  );
}

/** Shown when a step failed: what broke, and whether a fix is on offer. */
function FailurePanel({
  event,
  promotion,
}: {
  event: TraceEvent;
  promotion?: DecidedPromotionCandidate;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3.5">
      <div className="flex items-start gap-2.5">
        <Bug className="mt-0.5 size-4 shrink-0 text-red-400" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-red-200">What broke</p>
          <p className="text-sm text-red-100/90 text-pretty">
            {firstLine(event.error) ||
              'The step did not do what the test expected, and no further detail was recorded.'}
          </p>
        </div>
      </div>
      {promotion ? (
        <PromotionPointer promotion={promotion} />
      ) : (
        <p className="text-xs text-red-100/70">
          No automatic fix was produced for this step — it needs a human to look
          at it.
        </p>
      )}
    </div>
  );
}

/** Shown when a step was rescued by the AI. */
function RecoveryPanel({
  event,
  promotion,
}: {
  event: TraceEvent;
  promotion?: DecidedPromotionCandidate;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3.5">
      <div className="flex items-start gap-2.5">
        <Wand2 className="mt-0.5 size-4 shrink-0 text-sky-400" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-sky-200">
            How the system got past it
          </p>
          <p className="text-sm text-sky-100/90 text-pretty">
            {event.reasoning ||
              'The AI found a different way to perform this step and it worked.'}
          </p>
          {event.actionTaken ? (
            <p className="text-xs text-sky-100/70">
              It ended up doing: <Mono>{event.actionTaken}</Mono>
            </p>
          ) : null}
        </div>
      </div>
      {promotion ? (
        <PromotionPointer promotion={promotion} />
      ) : (
        <p className="text-xs text-sky-100/70">
          No promotion was recorded for this step, so future runs will retry the
          same recovery.
        </p>
      )}
    </div>
  );
}

/** Deep-link into the review screen, with the shape of the change. */
function PromotionPointer({
  promotion,
}: {
  promotion: DecidedPromotionCandidate;
}) {
  const actionChanged =
    promotion.originalStep.action !== promotion.proposedStep.action;
  const label =
    promotion.status === 'pending'
      ? 'A fix is waiting for review'
      : promotion.status === 'approved'
        ? 'A fix was accepted'
        : 'A suggested fix was rejected';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-xs">
        {promotion.status === 'approved' ? (
          <ShieldCheck className="size-3.5 text-emerald-400" />
        ) : (
          <Wand2 className="size-3.5 text-sky-400" />
        )}
        {label}
        {actionChanged ? (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
            changes the step’s action
          </span>
        ) : null}
      </span>
      <Button
        variant="outline"
        size="sm"
        render={<Link href={`/promotions/${promotion.promotionCandidateId}`} />}
      >
        Review the fix
        <ArrowRight className="size-3.5" />
      </Button>
    </div>
  );
}

function firstLine(value: string | null | undefined) {
  if (!value) return '';
  const line = value.split('\n')[0].replace(/^Error:\s*/, '');

  return line.length > 220 ? `${line.slice(0, 219)}…` : line;
}

/** Compact summary strip: "3 passed · 1 recovered · 1 failed". */
export function TraceSummaryLine({
  events,
  className,
}: {
  events: TraceEvent[];
  className?: string;
}) {
  const counts = {
    passed: events.filter((event) => event.status === 'passed').length,
    recovered: events.filter((event) => event.status === 'recovered').length,
    failed: events.filter((event) => event.status === 'failed').length,
  };

  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1.5',
          TONE_CLASSES.success.text,
        )}
      >
        <CircleCheck className="size-3.5" />
        {pluralize(counts.passed, 'step')} passed
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5',
          TONE_CLASSES.info.text,
        )}
      >
        <Wand2 className="size-3.5" />
        {counts.recovered} recovered
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5',
          TONE_CLASSES.danger.text,
        )}
      >
        <Bug className="size-3.5" />
        {counts.failed} failed
      </span>
    </p>
  );
}

export function StepActionSummary({ step }: { step: TestStep }) {
  const parts: ReactNode[] = [
    <span key="action">{humanizeAction(step.action)}</span>,
  ];

  if (step.selector) parts.push(<Mono key="selector">{step.selector}</Mono>);
  if (step.value) parts.push(<Mono key="value">{step.value}</Mono>);

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      {parts}
    </span>
  );
}
