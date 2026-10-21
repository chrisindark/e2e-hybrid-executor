'use client';

import type { LucideIcon } from 'lucide-react';
import {
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock,
  GitPullRequest,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  modeMeta,
  promotionStatusMeta,
  statusMeta,
  TONE_CLASSES,
} from '@/lib/status';
import { cn } from '@/lib/utils';

const STATUS_ICON: Record<string, LucideIcon> = {
  queued: Clock,
  pending: CircleDashed,
  running: LoaderCircle,
  passed: CircleCheck,
  recovered: RotateCcw,
  failed: CircleX,
};

const PROMOTION_ICON: Record<string, LucideIcon> = {
  pending: GitPullRequest,
  approved: ShieldCheck,
  rejected: ShieldX,
};

function Pill({
  tone,
  icon: Icon,
  label,
  spin,
  className,
}: {
  tone: keyof typeof TONE_CLASSES;
  icon: LucideIcon;
  label: string;
  spin?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASSES[tone].badge,
        className,
      )}
    >
      <Icon className={cn('size-3.5', spin && 'animate-spin')} />
      {label}
    </span>
  );
}

/**
 * Human-readable status chip. `showMeaning` adds a tooltip explaining what the
 * status means, which is what makes this readable for non-technical reviewers.
 */
export function StatusBadge({
  status,
  kind = 'step',
  showMeaning = false,
  className,
}: {
  status: string | null | undefined;
  kind?: 'run' | 'step' | 'promotion';
  showMeaning?: boolean;
  className?: string;
}) {
  const meta =
    kind === 'promotion' ? promotionStatusMeta(status) : statusMeta(status);
  const icons = kind === 'promotion' ? PROMOTION_ICON : STATUS_ICON;
  const Icon = (status && icons[status]) || CircleDashed;

  const pill = (
    <Pill
      tone={meta.tone}
      icon={Icon}
      label={meta.label}
      spin={status === 'running'}
      className={className}
    />
  );

  if (!showMeaning) return pill;

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} className="inline-flex cursor-help" />}
      >
        {pill}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <span className="block">
          <strong className="mb-0.5 block">{meta.label}</strong>
          {meta.meaning}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

/** Which execution mode produced a trace event. */
export function ModeBadge({
  mode,
  className,
  showMeaning = false,
}: {
  mode: string | null | undefined;
  className?: string;
  showMeaning?: boolean;
}) {
  const meta = modeMeta(mode);

  const pill = (
    <Pill
      tone={meta.tone}
      icon={GitPullRequest}
      label={meta.short}
      className={className}
    />
  );

  if (!showMeaning) return pill;

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} className="inline-flex cursor-help" />}
      >
        {pill}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <span className="block">
          <strong className="mb-0.5 block">{meta.label}</strong>
          {meta.meaning}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

/** Just the status icon, for timelines and other compact layouts. */
export function StatusIcon({
  status,
  kind = 'step',
  className,
}: {
  status: string | null | undefined;
  kind?: 'run' | 'step' | 'promotion';
  className?: string;
}) {
  const icons = kind === 'promotion' ? PROMOTION_ICON : STATUS_ICON;
  const Icon = (status && icons[status]) || CircleDashed;

  return <Icon className={cn('size-4', className)} />;
}

/** A small coloured dot + label, used inside dense lists. */
export function StatusDot({
  status,
  className,
  kind = 'step',
}: {
  status: string | null | undefined;
  className?: string;
  kind?: 'run' | 'step' | 'promotion';
}) {
  const meta =
    kind === 'promotion' ? promotionStatusMeta(status) : statusMeta(status);

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      <span
        className={cn('size-2 rounded-full', TONE_CLASSES[meta.tone].dot)}
      />
      {meta.label}
    </span>
  );
}
