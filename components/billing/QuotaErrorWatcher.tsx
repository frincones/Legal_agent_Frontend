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
      if (res.status === 402 || res.status === 403) {
        try {
          const cloned = res.clone();
          const data = await cloned.json().catch(() => ({}));
          const detail = data?.detail || data || {};
          // 402 = quota_exceeded · 403 con error='module_not_entitled' = entitlements
          if (detail.error === 'quota_exceeded' || res.status === 402) {
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
          } else if (detail.error === 'module_not_entitled') {
            window.dispatchEvent(
              new CustomEvent('lexai:upgrade-required', {
                detail: {
                  kind: detail.module,
                  message: detail.message ||
                    `El módulo "${detail.module}" no está incluido en tu plan actual.`,
                },
              }),
            );
          }
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
