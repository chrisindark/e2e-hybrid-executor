'use client';

import { useState } from 'react';
import { api, TestRun } from '../lib/api';
import { MODE_COLOR, statusStyle } from '../lib/status';

interface Props {
  runs: TestRun[];
  selectedRun: TestRun | null;
  onRunSelected: (run: TestRun) => void;
}

export function ExecutionList({ runs, selectedRun, onRunSelected }: Props) {
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (runId: string) => {
    setLoadingRunId(runId);
    setError(null);
    try {
      onRunSelected(await api.getExecution(runId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingRunId(null);
    }
  };

  return (
    <section style={{ border: '1px solid #262b36', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Executions</h2>
      {runs.length === 0 && <p style={{ opacity: 0.6 }}>No executions yet.</p>}
      {runs.map((run) => (
        <button
          key={run.runId}
          onClick={() => void handleSelect(run.runId)}
          disabled={loadingRunId !== null}
          style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: 10, background: selectedRun?.runId === run.runId ? '#1d2939' : '#12151c', color: '#e7e9ee', border: '1px solid #262b36', borderRadius: 4, cursor: 'pointer' }}
        >
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{run.runId}</span>
          <span style={{ ...statusStyle(run.overallStatus), display: 'inline-block', marginLeft: 8, padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
            {run.overallStatus}
          </span>
          <span style={{ display: 'block', marginTop: 6, fontSize: 12, opacity: 0.65 }}>Test {run.testId}</span>
        </button>
      ))}
      {error && <p style={{ color: '#f87171', background: '#ef44441f', border: '1px solid #ef444466', padding: 10, borderRadius: 4 }}>{error}</p>}
      {selectedRun && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Selected execution trace</h3>
          {selectedRun.events.map((event) => (
            <div key={event.eventId} style={{ borderLeft: `3px solid ${MODE_COLOR[event.mode] ?? '#94a3b8'}`, padding: '8px 12px', marginBottom: 8, background: '#12151c', borderRadius: 4 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{event.mode} · {event.status} {event.durationMs ? `· ${event.durationMs}ms` : ''}</div>
              <div style={{ color: statusStyle(event.status).color, fontWeight: 600 }}>{event.customerExplanation}</div>
              {event.reasoning && <div style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.8, marginTop: 4 }}>Agent reasoning: {event.reasoning}</div>}
              {event.error && <div style={{ color: '#f87171', background: '#ef44441f', padding: 6, marginTop: 6, borderRadius: 4, fontSize: 12 }}>Error: {event.error}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
