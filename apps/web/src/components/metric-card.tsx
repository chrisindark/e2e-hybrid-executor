'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { CircleCheck, CircleX, Clock, Gauge, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { TONE_CLASSES } from '@/lib/status';
import { cn } from '@/lib/utils';

/** Big number card used on the dashboard. */
export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  href,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof TONE_CLASSES;
  href?: string;
  className?: string;
}) {
  const body = (
    <div
      className={cn(
        'flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors',
        href && 'hover:border-foreground/20 hover:bg-card/80',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {Icon ? (
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-lg border',
              TONE_CLASSES[tone].badge,
            )}
          >
            <Icon className="size-3.5" />
          </span>
        ) : null}
      </div>
      <div className="text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export interface Segment {
  key: string;
  label: string;
  count: number;
  tone: keyof typeof TONE_CLASSES;
}

/**
 * A single stacked bar showing the make-up of a set of results
 * (passed / recovered / failed), with a labelled legend underneath. This is the
 * quickest way for a non-technical reader to see "how much is green".
 */
export function StatusBar({
  segments,
  total,
  className,
  showLegend = true,
}: {
  segments: Segment[];
  total?: number;
  className?: string;
  showLegend?: boolean;
}) {
  const sum =
    total ?? segments.reduce((acc, segment) => acc + segment.count, 0);
  const visible = segments.filter((segment) => segment.count > 0);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {sum === 0
          ? null
          : visible.map((segment) => (
              <motion.div
                key={segment.key}
                initial={{ width: 0 }}
                animate={{ width: `${(segment.count / sum) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={cn('h-full', TONE_CLASSES[segment.tone].bar)}
                title={`${segment.label}: ${segment.count}`}
              />
            ))}
      </div>
      {showLegend ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {segments.map((segment) => (
            <span
              key={segment.key}
              className="inline-flex items-center gap-1.5"
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  TONE_CLASSES[segment.tone].dot,
                )}
              />
              {segment.label}
              <span className="font-medium text-foreground tabular-nums">
                {segment.count}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Pass-rate style gauge: a percentage with a small horizontal meter. */
export function PassRate({
  passed,
  total,
  className,
}: {
  passed: number;
  total: number;
  className?: string;
}) {
  const percent = total === 0 ? 0 : Math.round((passed / total) * 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {percent}%
        </span>
        <span className="text-xs text-muted-foreground">
          {passed} of {total} runs fully green
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={cn(
            'h-full',
            percent >= 80
              ? 'bg-emerald-500'
              : percent >= 50
                ? 'bg-amber-500'
                : 'bg-red-500',
          )}
        />
      </div>
    </div>
  );
}

export const METRIC_ICONS = {
  green: CircleCheck,
  failed: CircleX,
  inFlight: Clock,
  rate: TrendingUp,
  gauge: Gauge,
};
