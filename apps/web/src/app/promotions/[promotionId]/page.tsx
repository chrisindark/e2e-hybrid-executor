'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, ShieldX } from 'lucide-react';

import { useState } from 'react';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  ErrorState,
} from '@/components/states';
import { StatusBadge } from '@/components/status-badge';
import { StepDiff } from '@/components/step-diff';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/format';

export default function PromotionDetailPage() {
  const params = useParams<{ promotionId: string }>();
  const promotionId = params?.promotionId ?? '';

  const {
    data: candidate,
    error,
    loading,
    reload,
  } = useResource(() => api.getPromotion(promotionId), { deps: [promotionId] });

  const [deciding, setDeciding] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    if (!candidate) return;
    setDeciding(true);
    setDecisionError(null);
    try {
      await api.decidePromotion(candidate.promotionCandidateId, approve);
      reload();
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeciding(false);
    }
  }

  if (loading && !candidate) return <LoadingBlock rows={3} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!candidate) {
    return (
      <EmptyState
        title="Suggested fix not found"
        description="This suggestion may have already been resolved or the link is wrong."
        action={
          <Button render={<Link href="/promotions" />}>
            Back to suggestions
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review"
        title={
          candidate.originalStep.description ||
          `Step ${candidate.originalStep.order}`
        }
        description="Compare what the step does today with the suggested replacement, then accept or reject it."
        actions={
          <Button variant="outline" render={<Link href="/promotions" />}>
            <ArrowLeft className="size-4" />
            All suggestions
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={candidate.status} kind="promotion" showMeaning />
        <span className="text-xs text-muted-foreground">
          Suggested {formatDateTime(candidate.createdAt)}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why this was suggested</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {candidate.reasoning || 'No explanation was recorded.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What would change</CardTitle>
        </CardHeader>
        <CardContent>
          <StepDiff
            original={candidate.originalStep}
            proposed={candidate.proposedStep}
          />
        </CardContent>
      </Card>

      {candidate.status === 'pending' ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => decide(true)} disabled={deciding}>
            <ShieldCheck className="size-4" />
            {deciding ? 'Saving…' : 'Accept fix'}
          </Button>
          <Button
            variant="outline"
            onClick={() => decide(false)}
            disabled={deciding}
          >
            <ShieldX className="size-4" />
            Reject fix
          </Button>
          {decisionError ? (
            <p className="text-sm text-red-300">{decisionError}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This suggestion was {candidate.status} on{' '}
          {formatDateTime(candidate.decidedAt)}.
        </p>
      )}
    </div>
  );
}
