/**
 * RSC fetchers · server-side Railway calls authenticated with the user's
 * Supabase session token. Use ONLY from React Server Components or Route
 * Handlers — never from client components.
 *
 * On failure (401/500/network), returns null so the page can render an
 * empty/error state instead of crashing. The frontend falls back to mock
 * seed data only as a LAST resort during initial onboarding.
 */

import { createClient } from '@/lib/supabase/server';
import { railwayFetch, type RailwayError } from '@/lib/api/railway-client';

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function safeFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await railwayFetch<T>(path, { ...init, token });
  } catch (e) {
    const err = e as RailwayError;
    console.error('[RSC fetch]', path, err.status, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Types (matching backend response shapes)
// ─────────────────────────────────────────────────────────────────────

export type Matter = {
  id: string;
  display_id: string;
  client_id: string;
  titulo: string;
  materia: string;
  etapa_procesal: string | null;
  tribunal: string | null;
  expediente: string | null;
  status: string;
  priority: 'alta' | 'media' | 'baja';
  proxima_fecha: string | null;
  proxima_tipo: string | null;
  cuantia: number | null;
  pendientes: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  tipo: string;
  nombre: string;
  tax_id: string | null;
  personal_id: string | null;
  email: string | null;
  telefono: string | null;
  vip: boolean;
  consent_lfpdppp_at: string | null;
  consent_voice_recording: boolean;
  created_at: string;
};

export type CitationHit = {
  juris_id: string;
  corte: string;
  citation_ref: string;
  rubro: string | null;
  vigencia: string;
  url_oficial: string | null;
  ratio_decidendi: string | null;
  relevancia: 'Muy alta' | 'Alta' | 'Media';
  combined_score: number;
};

export type TimelineEvent = {
  id: string;
  ts: string;
  kind: string;
  actor_user_id: string | null;
  agent_run_id: string | null;
  payload: Record<string, unknown>;
};

export type HITLPending = {
  id: string;
  firm_id: string;
  user_id: string;
  matter_id: string | null;
  kind: string;
  payload: Record<string, unknown>;
  decision: string;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────────────
// Fetchers
// ─────────────────────────────────────────────────────────────────────

export async function fetchMatters(opts: { materia?: string; status?: string; limit?: number } = {}): Promise<Matter[]> {
  const qs = new URLSearchParams();
  if (opts.materia) qs.set('materia', opts.materia);
  if (opts.status) qs.set('status', opts.status);
  qs.set('limit', String(opts.limit ?? 50));
  const data = await safeFetch<Matter[]>(`/v1/matters/?${qs}`);
  return data ?? [];
}

export async function fetchMatter(id: string): Promise<Matter | null> {
  return safeFetch<Matter>(`/v1/matters/${encodeURIComponent(id)}`);
}

export async function fetchMatterTimeline(id: string): Promise<TimelineEvent[]> {
  const data = await safeFetch<{ items: TimelineEvent[] }>(`/v1/matters/${encodeURIComponent(id)}/timeline`);
  return data?.items ?? [];
}

export async function fetchClients(q?: string): Promise<ClientRow[]> {
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  qs.set('limit', '50');
  const data = await safeFetch<ClientRow[]>(`/v1/clients/?${qs}`);
  return data ?? [];
}

export async function fetchClient(id: string): Promise<ClientRow | null> {
  return safeFetch<ClientRow>(`/v1/clients/${encodeURIComponent(id)}`);
}

export async function searchCitations(query: string, opts: { corte?: string; limit?: number } = {}): Promise<CitationHit[]> {
  const data = await safeFetch<CitationHit[]>('/v1/citations/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      corte: opts.corte,
      limit: opts.limit ?? 8,
    }),
  });
  return data ?? [];
}

export async function fetchHITLPending(): Promise<HITLPending[]> {
  const data = await safeFetch<HITLPending[]>('/v1/hitl/');
  return data ?? [];
}
