'use client';

import { useState } from 'react';
import Link from 'next/link';

import { api, type TestWithSteps } from '@/lib/api';
import type { GeneratedTest } from '@/lib/types';
import { EmptyState, PageHeader } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StepList } from '@/components/step-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function IntentPage() {
  const [intent, setIntent] = useState('');
  const [targetUrl, setTargetUrl] = useState('http://localhost:8099');
  const [generated, setGenerated] = useState<GeneratedTest | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTest, setSavedTest] = useState<TestWithSteps | null>(null);

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSavedTest(null);
    setGenerated(null);
    try {
      const result = await api.generateFromIntent(intent, targetUrl);
      setGenerated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSave() {
    if (!generated) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await api.saveGeneratedTest(generated);
      setSavedTest(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tests"
        title="Describe a test"
        description="Write what you want checked in plain English. The AI turns it into structured steps you can review, run, and keep."
      />

      <form
        onSubmit={handleGenerate}
        className="space-y-4 rounded-xl border border-border bg-card p-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="intent">What should be tested?</Label>
          <Textarea
            id="intent"
            rows={3}
            placeholder="e.g. A customer can log in with a valid email and password and sees a welcome message."
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="url">Target page URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://…"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={!intent.trim() || !targetUrl.trim()}>
            Generate steps
          </Button>
          {generated ? (
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save as test'}
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </form>

      {generated ? (
        <Card>
          <CardHeader>
            <CardTitle>{generated.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {generated.originalIntent}
            </p>
          </CardHeader>
          <CardContent>
            <StepList steps={generated.steps} testId="preview" />
          </CardContent>
        </Card>
      ) : null}

      {savedTest ? (
        <EmptyState
          title="Test saved"
          description={`“${savedTest.name}” is now in your library with ${savedTest.steps.length} steps.`}
          action={
            <Button render={<Link href={`/tests/${savedTest.testId}`} />}>
              Open the test
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
