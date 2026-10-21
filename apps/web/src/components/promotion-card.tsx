'use client';

import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ShieldX,
  GitPullRequest,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { StepDiff } from '@/components/step-diff';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { DecidedPromotionCandidate } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * A single "suggested fix" card used in the review queue. Shows status, the
 * before/after diff, the reason it was suggested, and a pointer to the full
 * review page. Designed so a reviewer who only skim-reads understands "what
 * broke and what the fix does".
 */
export function PromotionCard({
  candidate,
  compact = false,
}: {
  candidate: DecidedPromotionCandidate;
  compact?: boolean;
}) {
  const actionChanged =
    candidate.originalStep.action !== candidate.proposedStep.action;

  return (
    <Card
      className={cn(
        'h-full',
        candidate.status === 'pending' && 'ring-1 ring-amber-500/30',
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">
              {candidate.originalStep.description ||
                `Step ${candidate.originalStep.order}`}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                Step {candidate.originalStep.order} · run{' '}
                {candidate.runId.slice(0, 8)}…
              </span>
              <span>· suggested {formatRelative(candidate.createdAt)}</span>
            </div>
          </div>
          <StatusBadge status={candidate.status} kind="promotion" showMeaning />
        </div>
        {actionChanged ? (
          <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-300">
            Changes what the step does
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {candidate.reasoning ||
            'No explanation was recorded for this suggestion.'}
        </p>
        {!compact ? (
          <StepDiff
            original={candidate.originalStep}
            proposed={candidate.proposedStep}
          />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            {candidate.status === 'approved'
              ? `Accepted ${formatDateTime(candidate.decidedAt)}`
              : candidate.status === 'rejected'
                ? `Rejected ${formatDateTime(candidate.decidedAt)}`
                : 'Waiting for your decision'}
          </span>
          <Button
            size="sm"
            variant={candidate.status === 'pending' ? 'default' : 'outline'}
            render={
              <Link href={`/promotions/${candidate.promotionCandidateId}`} />
            }
          >
            {candidate.status === 'pending' ? 'Review' : 'Open'}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PromotionStatusIcon({ status }: { status: string }) {
  if (status === 'approved')
    return <ShieldCheck className="size-4 text-emerald-400" />;
  if (status === 'rejected')
    return <ShieldX className="size-4 text-muted-foreground" />;
  return <GitPullRequest className="size-4 text-amber-400" />;
}

export { CheckCircle2, XCircle };
