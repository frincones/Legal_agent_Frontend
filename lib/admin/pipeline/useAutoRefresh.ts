/**
 * lib/admin/pipeline/useAutoRefresh.ts
 *
 * Hook generico para fetch + auto-refresh con polling intervalico.
 * Devuelve { data, source, isLoading, error, refresh, lastFetched }.
 *
 * Usa fetch nativo. Cancela request anterior si cambia el endpoint.
 * Pausa polling cuando la pestaña no esta visible (visibility API).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAutoRefreshOptions {
  /** Intervalo en ms (default 10000 = 10s). */
  intervalMs?: number;
  /** Si false, no hace polling automatico. Default true. */
  enabled?: boolean;
}

interface UseAutoRefreshResult<T> {
  data: T | null;
  source: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastFetched: Date | null;
}

export function useAutoRefresh<T>(
  endpoint: string,
  options: UseAutoRefreshOptions = {},
): UseAutoRefreshResult<T> {
  const { intervalMs = 10000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch(endpoint, { signal: ac.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data ?? null);
      setSource(json.source ?? null);
      setError(null);
      setLastFetched(new Date());
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  // Initial fetch + polling
  useEffect(() => {
    if (!enabled) return;

    void fetchData();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          void fetchData();
        }
      }, intervalMs);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startPolling();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchData();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      abortRef.current?.abort();
    };
  }, [endpoint, intervalMs, enabled, fetchData]);

  return { data, source, isLoading, error, refresh: fetchData, lastFetched };
}
