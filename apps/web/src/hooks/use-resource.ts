'use client';

/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Resource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Re-run the loader (also used by polling). */
  reload: () => void;
}

export interface ResourceOptions<T> {
  /** Extra dependencies that should trigger a re-fetch. */
  deps?: unknown[];
  /** Poll interval in ms. Pass null/undefined to disable. */
  pollMs?: number | null;
  /** Only poll while this returns true (e.g. a run is still in flight). */
  shouldPoll?: (data: T | null) => boolean;
  /** Skip the initial fetch entirely. */
  enabled?: boolean;
}

/**
 * Load data from an async function, with loading/error state, manual reload,
 * and optional polling. Polling is how the UI keeps up with runs, which the
 * gateway accepts asynchronously (it returns 202 before any step executes).
 */
export function useResource<T>(
  loader: () => Promise<T>,
  options: ResourceOptions<T> = {},
): Resource<T> {
  const { deps = [], pollMs = null, shouldPoll, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [nonce, setNonce] = useState(0);

  // Keep the latest loader without making it a dependency of the effect.
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });
  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);

      return;
    }

    let cancelled = false;
    setLoading(true);

    loaderRef
      .current()
      .then((value) => {
        if (cancelled) return;
        setData(value);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nonce, ...deps]);

  const polling = Boolean(
    enabled && pollMs && (!shouldPoll || shouldPoll(data)),
  );

  useEffect(() => {
    if (!polling || !pollMs) return;

    const id = window.setInterval(reload, pollMs);

    return () => window.clearInterval(id);
  }, [polling, pollMs, reload]);

  return { data, error, loading, reload };
}

/** Refresh data whenever the browser tab regains focus (cheap freshness). */
export function useRefreshOnFocus(reload: () => void) {
  useEffect(() => {
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);
}
