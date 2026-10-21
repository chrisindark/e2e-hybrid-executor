'use client';

import { motion } from 'framer-motion';
import {
  CircleCheck,
  CircleX,
  Info,
  RefreshCw,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Page title block: eyebrow, heading, supporting copy and right-aligned actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          {eyebrow ? (
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm text-muted-foreground text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Friendly placeholder for "there is nothing here yet". */
export function EmptyState({
  icon: Icon = Info,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** Error surface with a retry affordance. */
export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <CircleX className="mt-0.5 size-5 shrink-0 text-red-400" />
        <div className="space-y-1">
          <p className="font-medium text-red-200">Something went wrong</p>
          <p className="text-sm break-words text-red-200/80">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Skeleton rows used while a page or panel is loading. */
export function LoadingBlock({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="space-y-2 rounded-xl border border-border bg-card p-4"
        >
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

type CalloutTone = 'info' | 'warning' | 'danger' | 'success' | 'neutral';

const CALLOUT_STYLES: Record<
  CalloutTone,
  { wrap: string; icon: string; Icon: LucideIcon }
> = {
  info: {
    wrap: 'border-sky-500/30 bg-sky-500/5',
    icon: 'text-sky-400',
    Icon: Info,
  },
  success: {
    wrap: 'border-emerald-500/30 bg-emerald-500/5',
    icon: 'text-emerald-400',
    Icon: CircleCheck,
  },
  warning: {
    wrap: 'border-amber-500/30 bg-amber-500/5',
    icon: 'text-amber-400',
    Icon: TriangleAlert,
  },
  danger: {
    wrap: 'border-red-500/30 bg-red-500/5',
    icon: 'text-red-400',
    Icon: CircleX,
  },
  neutral: {
    wrap: 'border-border bg-muted/40',
    icon: 'text-muted-foreground',
    Icon: Info,
  },
};

/** A small explanatory box — used for "what this means" / "what to do next". */
export function Callout({
  tone = 'info',
  title,
  icon,
  children,
  className,
}: {
  tone?: CalloutTone;
  title?: ReactNode;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
}) {
  const styles = CALLOUT_STYLES[tone];
  const Icon = icon ?? styles.Icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3',
        styles.wrap,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', styles.icon)} />
      <div className="min-w-0 space-y-1 text-sm">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? (
          <div className="text-muted-foreground">{children}</div>
        ) : null}
      </div>
    </div>
  );
}

/** Subtle entrance animation for lists and panels. */
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Key/value row used across the detail pages. */
export function DetailRow({
  label,
  value,
  hint,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-0.5 py-2', className)}>
      <dt className="flex items-center gap-1 text-xs tracking-wide text-muted-foreground uppercase">
        {label}
        {hint}
      </dt>
      <dd className="text-sm break-words">{value}</dd>
    </div>
  );
}
