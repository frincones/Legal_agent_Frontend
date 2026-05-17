/**
 * Client for /api/templates/* endpoints.
 *
 * Used by:
 *  - components/templates/TemplateSearchPicker.tsx
 *  - components/assistant/AssistantComposer.tsx (when slash menu triggers)
 *  - future generation entry points (Sprint 3 tabs)
 */

export interface TemplateSearchHit {
  template_id: string;
  name: string;
  materia: string | null;
  doc_type: string;
  subtype: string | null;
  jurisdiction: string;
  quality_score: number | null;
  is_system: boolean;
  score: number;
  snippet: string;
  applicable_norms: string[];
}

export interface TemplateSearchResponse {
  q: string;
  count: number;
  results: TemplateSearchHit[];
}

export interface TemplateSearchParams {
  q: string;
  materia?: string;
  doc_type?: string;
  limit?: number;
  include_firm?: boolean;
}

export async function searchTemplates(
  params: TemplateSearchParams,
  init?: RequestInit,
): Promise<TemplateSearchResponse> {
  const res = await fetch('/api/templates/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
    cache: 'no-store',
    ...init,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`searchTemplates failed: ${res.status} ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as TemplateSearchResponse;
}

export interface TemplateDetail {
  id: string;
  name: string;
  doc_type: string;
  jurisdiction: string;
  materia: string | null;
  subtype: string | null;
  content_md: string;
  variables: string[];
  applicable_norms: string[];
  quality_score: number | null;
  clauses: unknown;
  is_system: boolean;
  usage_count: number;
  last_used_at: string | null;
}

export async function getTemplateById(
  id: string,
  init?: RequestInit,
): Promise<TemplateDetail> {
  const res = await fetch(`/api/templates/system/by-id/${encodeURIComponent(id)}`, {
    method: 'GET',
    cache: 'no-store',
    ...init,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`getTemplateById failed: ${res.status} ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as TemplateDetail;
}
