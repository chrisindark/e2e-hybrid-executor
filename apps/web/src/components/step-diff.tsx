'use client';

import { ArrowRight, TriangleAlert } from 'lucide-react';

import { Mono } from '@/components/bits';
import { Field } from '@/components/bits';
import { actionMeta, TONE_CLASSES } from '@/lib/status';
import { checkText, isCheck, stepDiffFields } from '@/lib/steps';
import type { TestStep } from '@/lib/types';
import { cn } from '@/lib/utils';

function StepSnapshot({
  title,
  step,
  tone,
  changedFields,
}: {
  title: string;
  step: TestStep;
  tone: 'neutral' | 'success';
  changedFields: string[];
}) {
  const changed = (field: string) => changedFields.includes(field);
  const fieldClass = (field: string) =>
    changed(field)
      ? cn('rounded-md px-1.5 py-1 ring-1 ring-inset', TONE_CLASSES[tone].badge)
      : '';

  return (
    <div className="min-w-0 space-y-3">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>

      <div className="space-y-2">
        <Field label="Action">
          <span className={cn('inline-block', fieldClass('action'))}>
            {actionMeta(step.action).label}
          </span>
        </Field>

        <Field label="Finds element">
          <span className={cn('inline-block', fieldClass('selector'))}>
            {step.selector ? <Mono>{step.selector}</Mono> : <span>—</span>}
          </span>
        </Field>

        {step.value ? (
          <Field label="Value">
            <span className={cn('inline-block', fieldClass('value'))}>
              <Mono>{step.value}</Mono>
            </span>
          </Field>
        ) : null}

        <Field
          label={isCheck(step) ? 'Must contain' : 'Expected after the action'}
        >
          <span className={cn('inline-block', fieldClass('expectedOutcome'))}>
            {checkText(step) || '—'}
          </span>
        </Field>

        <Field label="Description">
          <span className={cn('inline-block', fieldClass('description'))}>
            {step.description || '—'}
          </span>
        </Field>
      </div>
    </div>
  );
}

/**
 * Side-by-side "as written today" vs "suggested replacement". Changed fields
 * are highlighted, and a change of *action* (e.g. checking a heading becoming a
 * page navigation) is called out loudly, because that changes what the test
 * actually verifies.
 */
export function StepDiff({
  original,
  proposed,
  className,
}: {
  original: TestStep;
  proposed: TestStep;
  className?: string;
}) {
  const diff = stepDiffFields(original, proposed);
  const changedFields = diff.map((entry) => entry.field);
  const actionChanged = changedFields.includes('action');

  return (
    <div className={cn('space-y-4', className)}>
      {actionChanged ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />
          <div className="space-y-0.5 text-sm">
            <p className="font-medium text-amber-200">
              This fix changes what the step does, not just how it finds an
              element
            </p>
            <p className="text-amber-100/80">
              It goes from “{actionMeta(original.action).label}” to “
              {actionMeta(proposed.action).label}”. Accept it only if that is
              genuinely what the test should do now — otherwise the check itself
              is being weakened.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <StepSnapshot
            title="As written today"
            step={original}
            tone="neutral"
            changedFields={changedFields}
          />
        </div>

        <div className="hidden items-center justify-center sm:flex">
          <ArrowRight className="size-4 text-muted-foreground" />
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <StepSnapshot
            title="Suggested replacement"
            step={proposed}
            tone="success"
            changedFields={changedFields}
          />
        </div>
      </div>

      {diff.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          The two versions are identical — nothing would change.
        </p>
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            What changes
          </p>
          <ul className="space-y-1 text-xs">
            {diff.map((entry) => (
              <li
                key={entry.field}
                className="flex flex-wrap items-baseline gap-1.5"
              >
                <span className="font-medium">{entry.field}</span>
                <Mono className="bg-red-500/10 text-red-200 line-through decoration-red-400/60">
                  {entry.before || '—'}
                </Mono>
                <ArrowRight className="size-3 text-muted-foreground" />
                <Mono className="bg-emerald-500/10 text-emerald-200">
                  {entry.after || '—'}
                </Mono>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
