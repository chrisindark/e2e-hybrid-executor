'use client';

import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  ErrorState,
} from '@/components/states';
import { PromotionCard } from '@/components/promotion-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PromotionsPage() {
  const { data, error, loading, reload } = useResource(
    () => api.listPromotions(),
    {
      pollMs: 15000,
    },
  );

  const candidates = (data ?? []).map((item) => item);
  const pending = candidates.filter((item) => item.status === 'pending');
  const approved = candidates.filter((item) => item.status === 'approved');
  const rejected = candidates.filter((item) => item.status === 'rejected');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review"
        title="Suggested fixes"
        description="When a scripted step fails and the system finds a working alternative, the repair is offered here. Accept it to save a new version of the test; reject it to leave the test untouched."
      />

      {loading && !data ? <LoadingBlock rows={3} /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && candidates.length === 0 ? (
        <EmptyState
          title="No suggested fixes yet"
          description="Run a test that needs recovery and a suggestion will appear here."
        />
      ) : null}

      {candidates.length > 0 ? (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Needs review ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Accepted ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejected.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4 space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing is waiting for review.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {pending.map((candidate) => (
                  <PromotionCard
                    key={candidate.promotionCandidateId}
                    candidate={candidate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="approved" className="mt-4 space-y-3">
            {approved.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No fixes have been accepted yet.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {approved.map((candidate) => (
                  <PromotionCard
                    key={candidate.promotionCandidateId}
                    candidate={candidate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="rejected" className="mt-4 space-y-3">
            {rejected.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No fixes have been rejected.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {rejected.map((candidate) => (
                  <PromotionCard
                    key={candidate.promotionCandidateId}
                    candidate={candidate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
