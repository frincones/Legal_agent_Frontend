'use client';

import { useEffect } from 'react';

/**
 * Intercepta window.fetch globalmente · cuando una respuesta es 402
 * (quota_exceeded), dispara el evento 'lexai:upgrade-required' con
 * los detalles, para que UpgradeModal se abra.
 *
 * Se monta una sola vez en (app)/layout. No-op en SSR.
 * Idempotente · si ya está instalado, no reinstala.
 */
export function QuotaErrorWatcher() {
  useEffect(() => {
    const w = window as unknown as Window & { __lexaiQuotaWatcher?: boolean };
    if (w.__lexaiQuotaWatcher) return;
    w.__lexaiQuotaWatcher = true;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await originalFetch(input, init);
      if (res.status === 402) {
        try {
          // Clone so callers can still read the body.
          const cloned = res.clone();
          const data = await cloned.json().catch(() => ({}));
          const detail = data?.detail || data || {};
          window.dispatchEvent(
            new CustomEvent('lexai:upgrade-required', {
              detail: {
                kind: detail.kind,
                used: detail.used,
                quota: detail.quota,
                plan: detail.plan,
                message: detail.message,
              },
            }),
          );
        } catch {
          // ignore
        }
      }
      return res;
    };

    return () => {
      // No restauramos · listener inocuo en HMR.
    };
  }, []);
  return null;
}
