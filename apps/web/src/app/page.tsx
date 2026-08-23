'use client';

import { useEffect, useState } from 'react';
import { IntentInput } from '../components/IntentInput';
import { RunViewer } from '../components/RunViewer';
import { PromotionReview } from '../components/PromotionReview';
import { ExecutionList } from '../components/ExecutionList';
import { api, TestRun, TestStore } from '../lib/api';

export default function Home() {
  const [tests, setTests] = useState<TestStore[]>([]);
  const [test, setTest] = useState<TestStore | null>(null);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [savedTests, savedRuns] = await Promise.all([
        api.listTests(),
        api.listExecutions(),
      ]);
      setTests(savedTests);
      setRuns(savedRuns);
      if (test) {
        const currentTest = savedTests.find((savedTest) => savedTest.testId === test.testId);
        setTest(currentTest ?? null);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleTestGenerated = (savedTest: TestStore) => {
    setTest(savedTest);
    setTests((currentTests) => [
      savedTest,
      ...currentTests.filter((currentTest) => currentTest.testId !== savedTest.testId),
    ]);
  };

  const handleTestSelected = async (testId: string) => {
    if (!testId) {
      setTest(null);
      return;
    }

    try {
      setError(null);
      setTest(await api.getTest(testId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRunComplete = (run: TestRun) => {
    setSelectedRun(run);
    setRuns((currentRuns) => [
      run,
      ...currentRuns.filter((currentRun) => currentRun.runId !== run.runId),
    ]);
    setRefreshKey((key) => key + 1);
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Hybrid Test Execution</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Capture an intent → run it deterministically → force a fallback → review the promotion.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <IntentInput onTestGenerated={handleTestGenerated} />

        <section style={{ border: '1px solid #262b36', borderRadius: 8, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Saved generations</h2>
          {loading && <p style={{ opacity: 0.6 }}>Loading saved tests...</p>}
          {!loading && tests.length === 0 && <p style={{ opacity: 0.6 }}>No saved tests yet.</p>}
          {tests.length > 0 && (
            <select
              value={test?.testId ?? ''}
              onChange={(event) => void handleTestSelected(event.target.value)}
              style={{ width: '100%', padding: 8, background: '#12151c', color: '#e7e9ee', border: '1px solid #262b36', borderRadius: 4 }}
            >
              <option value="">Select a saved test</option>
              {tests.map((savedTest) => (
                <option key={savedTest.testId} value={savedTest.testId}>
                  {savedTest.name}
                </option>
              ))}
            </select>
          )}
        </section>

        {test && <RunViewer test={test} onRunComplete={handleRunComplete} />}

        <ExecutionList runs={runs} selectedRun={selectedRun} onRunSelected={setSelectedRun} />

        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        <PromotionReview refreshKey={refreshKey} tests={tests} runs={runs} />
      </div>
    </main>
  );
}
