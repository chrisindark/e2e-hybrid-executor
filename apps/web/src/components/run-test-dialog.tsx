'use client';

import { PlayCircle, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MODES = [
  { value: 'deterministic', label: 'Scripted only' },
  { value: 'deterministic-with-fallback', label: 'Scripted, AI rescue' },
];

/**
 * A small dialog that starts a run. Keeps the page that opens it simple: the
 * user picks how much AI is allowed and optionally asks us to deliberately
 * break one step (useful for showing recovery).
 */
export function RunTestDialog({
  testId,
  testName,
  onStarted,
}: {
  testId: string;
  testName: string;
  onStarted: (runId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('deterministic-with-fallback');
  const [forceFailure, setForceFailure] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const forced = forceFailure.trim()
        ? Number(forceFailure.trim())
        : undefined;
      const result = await (
        await import('@/lib/api')
      ).api.startRun(testId, {
        mode,
        forceFailureAtStep: Number.isFinite(forced) ? forced : undefined,
      });
      setOpen(false);
      setForceFailure('');
      onStarted(result.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlayCircle className="size-4" />
        Run this test
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Run “{testName}”</DialogTitle>
          <DialogDescription>
            The run starts in the background and the page will update as steps
            finish.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mode">How much AI is allowed</Label>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value ?? mode)}
            >
              <SelectTrigger id="mode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="forceFailure">
              Deliberately break step number (optional)
            </Label>
            <Input
              id="forceFailure"
              type="number"
              min={1}
              placeholder="e.g. 3"
              value={forceFailure}
              onChange={(event) => setForceFailure(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              <SlidersHorizontal className="mr-1 inline size-3" />
              Useful for demonstrating recovery: the named step&apos;s selector
              will be corrupted so the scripted run fails.
            </p>
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Starting…' : 'Start run'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
