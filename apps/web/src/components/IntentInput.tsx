'use client';

import { useState } from 'react';
import { api, TestStore } from '../lib/api';

interface Props {
  onTestGenerated: (test: TestStore) => void;
}

export function IntentInput({ onTestGenerated }: Props) {
  const [intent, setIntent] = useState(
    'Log in as standard_user, add the first product to the cart, and check out.',
  );
  const [targetUrl, setTargetUrl] = useState('https://www.saucedemo.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const test = await api.createTestFromIntent(intent, targetUrl);
      onTestGenerated(test);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #262b36', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>1. Capture Intent</h2>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
        Target URL
      </label>
      <input
        value={targetUrl}
        onChange={(e) => setTargetUrl(e.target.value)}
        style={{ width: '100%', marginBottom: 12, padding: 8, background: '#12151c', color: '#e7e9ee', border: '1px solid #262b36', borderRadius: 4 }}
      />
      <label style={{ display: 'block', marginBottom: 8, fontSize: 13, opacity: 0.8 }}>
        Test intent (plain English)
      </label>
      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        rows={3}
        style={{ width: '100%', marginBottom: 12, padding: 8, background: '#12151c', color: '#e7e9ee', border: '1px solid #262b36', borderRadius: 4 }}
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        {loading ? 'Generating...' : 'Generate structured test'}
      </button>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
    </div>
  );
}
