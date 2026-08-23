'use client';

import { useEffect, useState } from 'react';
import { api, PromotionCandidate, TestRun, TestStep, TestStore } from '../lib/api';
import { statusStyle } from '../lib/status';

interface Props {
  /** bump this to force a refetch after a new run completes */
  refreshKey: number;
  tests: TestStore[];
  runs: TestRun[];
}

function parseStep(step: string): TestStep | null {
  try {
    return JSON.parse(step) as TestStep;
  } catch {
    return null;
  }
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : 'In progress';
}

export function PromotionReview({ refreshKey, tests, runs }: Props) {
  const [candidates, setCandidates] = useState<PromotionCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const list = await api.listPromotionCandidates();
      setCandidates(list);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const decide = async (promotionCandidateId: string, approve: boolean) => {
    setDecidingId(promotionCandidateId);
    try {
      setError(null);
      await api.decidePromotionCandidate(promotionCandidateId, approve);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDecidingId(null);
    }
  };

  if (candidates.length === 0) {
    return (
      <div style={{ border: '1px solid #262b36', borderRadius: 8, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>4. Promotion Review</h2>
        <p style={{ opacity: 0.6, fontSize: 13 }}>No promotion candidates yet - run a test with a forced fallback to generate one.</p>
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #262b36', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>4. Promotion Review</h2>
      {error && <p style={{ color: '#f87171', background: '#ef44441f', border: '1px solid #ef444466', padding: 10, borderRadius: 4 }}>{error}</p>}
      {candidates.map((c) => (
        <div key={c.promotionCandidateId} style={{ background: '#12151c', borderRadius: 4, padding: 12, marginBottom: 8 }}>
          {(() => {
            const originalStep = parseStep(c.originalStep);
            const proposedStep = parseStep(c.proposedStep);
            const test = tests.find((item) => item.testId === c.testId);
            const run = runs.find((item) => item.runId === c.runId);

            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                  <strong>{test?.name ?? `Test ${c.testId}`}</strong>
                  <span style={{ ...statusStyle(c.status), padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{c.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
                  <div>Run: <span style={{ fontFamily: 'monospace' }}>{c.runId}</span></div>
                  <div>Step ID: <span style={{ fontFamily: 'monospace' }}>{c.stepId}</span></div>
                  <div>Run status: <strong style={{ color: run ? statusStyle(run.overallStatus).color : '#94a3b8' }}>{run?.overallStatus ?? 'Not loaded'}</strong></div>
                  <div>Created: {formatDate(c.createdAt)}</div>
                  {run && <div>Started: {formatDate(run.startedAt)}</div>}
                  {run && <div>Finished: {formatDate(run.finishedAt)}</div>}
                </div>
                {test && <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>Target: {test.targetUrl}</div>}
                <div style={{ border: '1px solid #262b36', borderRadius: 4, padding: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Affected test step</div>
                  <div style={{ fontSize: 13 }}>{originalStep?.description ?? 'Stored step unavailable'}</div>
                  {originalStep && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Step {originalStep.order} · {originalStep.action} · Expected: {originalStep.expectedOutcome}</div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, fontFamily: 'monospace', fontSize: 12, marginBottom: 10 }}>
                  <div style={{ color: '#f87171', background: '#ef44441f', padding: 8, borderRadius: 4 }}>Original selector<br />{originalStep?.selector ?? '-'}</div>
                  <div style={{ color: '#4ade80', background: '#22c55e1f', padding: 8, borderRadius: 4 }}>Proposed selector<br />{proposedStep?.selector ?? '-'}</div>
                </div>
                {proposedStep?.value && <div style={{ fontSize: 12, marginBottom: 8 }}>Proposed value: <span style={{ fontFamily: 'monospace' }}>{proposedStep.value}</span></div>}
                <div style={{ fontSize: 13, marginBottom: 10 }}>{c.reasoning}</div>
                {c.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => void decide(c.promotionCandidateId, true)}
                      disabled={decidingId !== null}
                      style={{ padding: '6px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      {decidingId === c.promotionCandidateId ? 'Saving...' : 'Approve & promote'}
                    </button>
                    <button
                      onClick={() => void decide(c.promotionCandidateId, false)}
                      disabled={decidingId !== null}
                      style={{ padding: '6px 12px', background: '#374151', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ))}
    </div>
  );
}
