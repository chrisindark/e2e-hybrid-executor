'use client';

import { useState } from 'react';
import { api, TestRun, TestStore } from '../lib/api';
import { MODE_COLOR, statusStyle } from '../lib/status';

interface Props {
  test: TestStore;
  onRunComplete: (run: TestRun) => void;
}

export function RunViewer({ test, onRunComplete }: Props) {
  const [forceStep, setForceStep] = useState<number | undefined>(
    // test.steps[Math.min(1, test.steps.length - 1)]?.order,
    0
  );
  const [run, setRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.runTest(test.testId, forceStep);
      const runId = result.run?.identifiers?.[0]?.runId ?? result.runId;
      if (!runId) {
        throw new Error('The execution API did not return a run ID');
      }
      const testRun = await api.getExecution(runId);
      setRun(testRun);
      onRunComplete(testRun);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #262b36', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>2 &amp; 3. Run + Force Fallback</h2>

      <table style={{ width: '100%', fontSize: 13, marginBottom: 12, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', opacity: 0.7 }}>
            <th>#</th>
            <th>Description</th>
            <th>Action</th>
            <th>Selector</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {test.steps.map((s) => (
            <tr key={s.stepId} style={{ borderTop: '1px solid #262b36' }}>
              <td>{s.order}</td>
              <td>{s.description}</td>
              <td>{s.action}</td>
              <td style={{ fontFamily: 'monospace' }}>{s.selector ?? '-'}</td>
              <td style={{ fontFamily: 'monospace' }}>{s.value ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <label style={{ display: 'block', marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
        Force UI drift at step (simulates a broken selector):
      </label>
      <select
        value={forceStep ?? ''}
        onChange={(e) => setForceStep(e.target.value ? Number(e.target.value) : undefined)}
        style={{ marginBottom: 12, padding: 8, background: '#12151c', color: '#e7e9ee', border: '1px solid #262b36', borderRadius: 4 }}
      >
        <option value="">None (fully deterministic)</option>
        {test.steps.map((s) => (
          <option key={s.stepId} value={s.order}>
            Step {s.order}: {s.description}
          </option>
        ))}
      </select>
      <br />
      <button
        onClick={handleRun}
        disabled={loading}
        style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        {loading ? 'Running...' : 'Run test'}
      </button>
      {error && <p style={{ color: '#f87171', background: '#ef44441f', border: '1px solid #ef444466', padding: 10, borderRadius: 4 }}>{error}</p>}

      {run && (
        <div style={{ marginTop: 20 }}>
          <h3>Decision Trace</h3>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Overall status: <strong style={{ ...statusStyle(run.overallStatus), padding: '2px 7px', borderRadius: 10 }}>{run.overallStatus}</strong>
          </p>
          {run.events.map((ev) => (
            <div
              key={ev.eventId}
              style={{
                borderLeft: `3px solid ${MODE_COLOR[ev.mode] ?? '#94a3b8'}`,
                padding: '8px 12px',
                marginBottom: 8,
                background: '#12151c',
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {ev.mode} · {ev.status} {ev.durationMs ? `· ${ev.durationMs}ms` : ''}
              </div>
              <div style={{ ...statusStyle(ev.status), margin: '4px 0', padding: 6, borderRadius: 4 }}>{ev.customerExplanation}</div>
              {ev.reasoning && (
                <div style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.8 }}>
                  Agent reasoning: {ev.reasoning}
                </div>
              )}
              {ev.error && <div style={{ fontSize: 12, color: '#f87171', background: '#ef44441f', border: '1px solid #ef444466', padding: 6, borderRadius: 4 }}>Error: {ev.error}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
