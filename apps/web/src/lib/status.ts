/**
 * Plain-English metadata for every status/enum the API can return.
 *
 * The UI is meant to be readable by people who don't write code, so every
 * status exposes a short label plus a one-sentence explanation of what it
 * means for the test that just ran.
 */

import type {
  ExecutionMode,
  PromotionStatus,
  RunStatus,
  StepStatus,
  TestAction,
} from './types';

export type Tone =
  'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'progress';

export interface StatusMeta {
  /** Title-case label for humans. */
  label: string;
  /** One-sentence explanation of what the status means. */
  meaning: string;
  tone: Tone;
}

export const RUN_STATUS: Record<RunStatus, StatusMeta> = {
  queued: {
    label: 'Queued',
    meaning:
      'The run has been accepted and is waiting for a worker to pick it up.',
    tone: 'neutral',
  },
  pending: {
    label: 'Pending',
    meaning:
      'The run is being prepared but has not started executing steps yet.',
    tone: 'neutral',
  },
  running: {
    label: 'Running',
    meaning: 'Steps are executing right now. This page will update on its own.',
    tone: 'progress',
  },
  passed: {
    label: 'Passed',
    meaning: 'Every step behaved exactly as the test expected.',
    tone: 'success',
  },
  recovered: {
    label: 'Passed after a fix',
    meaning:
      'A step failed first, the system found a working alternative, and the test finished green.',
    tone: 'info',
  },
  failed: {
    label: 'Failed',
    meaning:
      'At least one step did not do what the test expected and could not be recovered.',
    tone: 'danger',
  },
};

export const STEP_STATUS: Record<StepStatus, StatusMeta> = {
  pending: {
    label: 'Not started',
    meaning: 'This step has not run yet.',
    tone: 'neutral',
  },
  running: {
    label: 'Running',
    meaning: 'This step is executing right now.',
    tone: 'progress',
  },
  passed: {
    label: 'Passed',
    meaning: 'The page did exactly what this step expected.',
    tone: 'success',
  },
  recovered: {
    label: 'Recovered',
    meaning:
      'This step failed as written, but a different approach worked. Review the suggested fix.',
    tone: 'info',
  },
  failed: {
    label: 'Failed',
    meaning: 'The page did not do what this step expected.',
    tone: 'danger',
  },
};

export const PROMOTION_STATUS: Record<PromotionStatus, StatusMeta> = {
  pending: {
    label: 'Needs review',
    meaning: 'A suggested fix is waiting for a human to accept or reject it.',
    tone: 'warning',
  },
  approved: {
    label: 'Fix accepted',
    meaning:
      'The suggested fix was accepted and saved as a new version of the test.',
    tone: 'success',
  },
  rejected: {
    label: 'Fix rejected',
    meaning:
      'The suggested fix was rejected. The test definition is unchanged.',
    tone: 'neutral',
  },
};

export const MODE_META: Record<ExecutionMode, StatusMeta & { short: string }> =
  {
    deterministic: {
      label: 'Scripted only',
      short: 'Scripted',
      meaning:
        'Runs the steps exactly as written. If a step fails, the run fails — no AI is involved.',
      tone: 'neutral',
    },
    'deterministic-with-fallback': {
      label: 'Scripted, AI rescue',
      short: 'Fallback',
      meaning:
        'Runs the steps as written, but if one fails it asks the AI to find another way to achieve it.',
      tone: 'warning',
    },
    'agentic-primary': {
      label: 'AI-driven',
      short: 'AI-driven',
      meaning:
        'The AI plans and performs the steps rather than following the scripted selectors.',
      tone: 'info',
    },
  };

export const ACTION_META: Record<
  TestAction,
  { label: string; sentence: string }
> = {
  '': { label: 'No action', sentence: 'This step has no action attached.' },
  goto: { label: 'Open a page', sentence: 'Open a page in the browser' },
  click: { label: 'Click', sentence: 'Click an element on the page' },
  fill: { label: 'Type text', sentence: 'Type text into a field' },
  assertText: {
    label: 'Check text',
    sentence: 'Check that text appears on the page',
  },
  assertVisible: {
    label: 'Check visible',
    sentence: 'Check that something is visible on the page',
  },
};

const FALLBACK_STATUS: StatusMeta = {
  label: 'Unknown',
  meaning: 'The API returned a status this UI does not recognise yet.',
  tone: 'neutral',
};

const ALL_STATUS: Record<string, StatusMeta> = {
  ...RUN_STATUS,
  ...STEP_STATUS,
};

export function statusMeta(status: string | null | undefined): StatusMeta {
  if (!status) return FALLBACK_STATUS;

  return ALL_STATUS[status.toLowerCase()] ?? FALLBACK_STATUS;
}

export function promotionStatusMeta(
  status: string | null | undefined,
): StatusMeta {
  if (!status) return FALLBACK_STATUS;

  return (
    PROMOTION_STATUS[status.toLowerCase() as PromotionStatus] ?? FALLBACK_STATUS
  );
}

export function modeMeta(
  mode: string | null | undefined,
): StatusMeta & { short: string } {
  if (!mode) return { ...FALLBACK_STATUS, short: '—' };

  return (
    MODE_META[mode.toLowerCase() as ExecutionMode] ?? {
      ...FALLBACK_STATUS,
      short: mode,
    }
  );
}

export function actionMeta(action: string | null | undefined) {
  if (action === null || action === undefined) return ACTION_META[''];

  return ACTION_META[action as TestAction] ?? ACTION_META[''];
}

/** Tailwind classes for each tone, used by chips, bars and dots. */
export const TONE_CLASSES: Record<
  Tone,
  { badge: string; dot: string; bar: string; text: string }
> = {
  success: {
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-500',
    text: 'text-emerald-300',
  },
  info: {
    badge: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    dot: 'bg-sky-400',
    bar: 'bg-sky-500',
    text: 'text-sky-300',
  },
  progress: {
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400',
    bar: 'bg-amber-500',
    text: 'text-amber-300',
  },
  warning: {
    badge: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    dot: 'bg-orange-400',
    bar: 'bg-orange-500',
    text: 'text-orange-300',
  },
  danger: {
    badge: 'border-red-500/30 bg-red-500/10 text-red-300',
    dot: 'bg-red-400',
    bar: 'bg-red-500',
    text: 'text-red-300',
  },
  neutral: {
    badge: 'border-border bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
    bar: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
};

export function isInFlight(status: string | null | undefined) {
  return status === 'queued' || status === 'pending' || status === 'running';
}

export function isProblemStatus(status: string | null | undefined) {
  return status === 'failed';
}
