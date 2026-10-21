/**
 * Formatting helpers shared by the UI.
 *
 * All data in this app is fetched on the client (the API requires a
 * tenant-scoped token), so date formatting never runs during server render and
 * cannot cause hydration mismatches.
 */

import { actionMeta } from './status';
import type { TestStep, TraceEvent } from './types';

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const TIME_ONLY = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

const DATE_ONLY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(
  value: string | Date | null | undefined,
  fallback = '—',
) {
  const date = toDate(value);

  return date ? DATE_TIME.format(date) : fallback;
}

export function formatTime(
  value: string | Date | null | undefined,
  fallback = '—',
) {
  const date = toDate(value);

  return date ? TIME_ONLY.format(date) : fallback;
}

export function formatDate(
  value: string | Date | null | undefined,
  fallback = '—',
) {
  const date = toDate(value);

  return date ? DATE_ONLY.format(date) : fallback;
}

/** "3 minutes ago" — used for lists where recency matters more than exact time. */
export function formatRelative(
  value: string | Date | null | undefined,
  fallback = '—',
) {
  const date = toDate(value);
  if (!date) return fallback;

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(date);
}

/** Millisecond duration in human units: "340 ms", "1.4 s", "2m 5s". */
export function formatDuration(ms: number | null | undefined, fallback = '—') {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return fallback;
  if (ms < 1000) return `${Math.max(0, Math.round(ms))} ms`;

  const seconds = ms / 1000;
  if (seconds < 60) {
    const rounded =
      seconds < 10 ? seconds.toFixed(1) : Math.round(seconds).toString();

    return `${rounded} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);

  return `${minutes}m ${remainder}s`;
}

/** How long a run took, or how long it has been going if it is still active. */
export function runDurationMs(run: {
  startedAt?: string | null;
  finishedAt?: string | null;
}): number | null {
  const start = toDate(run.startedAt);
  if (!start) return null;

  const end = toDate(run.finishedAt) ?? new Date();

  return Math.max(0, end.getTime() - start.getTime());
}

/** Milliseconds between two timestamps. */
export function betweenMs(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined,
): number | null {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) return null;

  return Math.max(0, end.getTime() - start.getTime());
}

/** Derive a step's duration from the gap to the next event, when not reported. */
export function eventDurationMs(event: TraceEvent): number | null {
  if (typeof event.durationMs === 'number') return event.durationMs;

  return null;
}

export function humanizeAction(action: string | null | undefined) {
  return actionMeta(action).label;
}

export function actionSentence(action: string | null | undefined) {
  return actionMeta(action).sentence;
}

/** Defensive JSON.parse for the promotion payloads stored as strings. */
export function parseStepPayload(
  value: string | null | undefined,
): TestStep | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed as TestStep;
  } catch {
    return null;
  }
}

/** Poor-man's pluraliser for UI copy ("1 step" / "3 steps"). */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function truncate(value: string | null | undefined, length = 120) {
  if (!value) return '';

  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

/** Short, copy-friendly id: "3f9a1c2b…". */
export function shortId(value: string | null | undefined, size = 8) {
  if (!value) return '—';

  return value.length <= size ? value : `${value.slice(0, size)}…`;
}

/** True when the string looks like it was produced by our own JSON parser. */
export function isJsonObject(value: string) {
  const trimmed = value.trim();

  return trimmed.startsWith('{') && trimmed.endsWith('}');
}

export function sumBy<T>(
  items: T[],
  pick: (item: T) => number | null | undefined,
) {
  return items.reduce((total, item) => total + (pick(item) ?? 0), 0);
}
