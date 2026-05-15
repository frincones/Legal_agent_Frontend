'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ModuleState = {
  enabled: boolean;
  category: string;
  name: string;
  is_core: boolean;
  has_override: boolean;
  ui_route: string | null;
};

export type QuotaState = {
  quota_key: string;
  name: string;
  unit: string;
  limit: number | null;
  soft_cap_pct: number;
  used: number;
  remaining: number | null;
  period_start: string;
  reset_period: string;
  enforcement: 'hard' | 'soft' | 'tracking_only';
  has_override: boolean;
};

export type EntitlementsSnapshot = {
  firm_id: string;
  plan: { code: string; name: string; status: string; trial_ends_at?: string | null; current_period_end?: string | null };
  modules: Record<string, ModuleState>;
  quotas: Record<string, QuotaState>;
  snapshot_at: string;
  enforcement_mode?: string;
};

type Ctx = {
  data: EntitlementsSnapshot | null;
  loading: boolean;
  error: string | null;
  has: (moduleKey: string) => boolean;
  quota: (quotaKey: string) => QuotaState | null;
  refresh: () => Promise<void>;
};

const EntitlementsCtx = createContext<Ctx>({
  data: null, loading: true, error: null,
  has: () => true,   // fail-open en SSR
  quota: () => null,
  refresh: async () => {},
});

const STORAGE_KEY = 'lexai.entitlements.cache';
const CACHE_TTL_MS = 30 * 1000;

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<EntitlementsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && Date.now() - new Date(parsed.snapshot_at).getTime() < CACHE_TTL_MS) {
            setData(parsed);
            setLoading(false);
            return;
          }
        } catch {}
      }
      const r = await fetch('/api/me/entitlements', { cache: 'no-store' });
      if (!r.ok) {
        setError(`HTTP ${r.status}`);
        setLoading(false);
        return;
      }
      const json = await r.json();
      setData(json);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(json)); } catch {}
    } catch (e: any) {
      setError(e.message || 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const has = useCallback((moduleKey: string): boolean => {
    // Durante la carga: permisivo (evita flicker)
    if (loading && !data) return true;
    // Sin data después de cargar (error 403, JWT sin firm_id, etc.): fail-CLOSE
    if (!data) return false;
    const m = data.modules[moduleKey];
    if (!m) {
      // Si el módulo NO está en el catálogo, asumimos permitido (no se debe romper la app)
      return true;
    }
    return m.enabled;
  }, [data, loading]);

  const quota = useCallback((quotaKey: string): QuotaState | null => {
    return data?.quotas[quotaKey] || null;
  }, [data]);

  return (
    <EntitlementsCtx.Provider value={{ data, loading, error, has, quota, refresh: load }}>
      {children}
    </EntitlementsCtx.Provider>
  );
}

export function useEntitlements() {
  return useContext(EntitlementsCtx);
}
