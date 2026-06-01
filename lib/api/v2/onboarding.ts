/**
 * Frontend SDK · /v2/onboarding/* (LexAI Claude-for-Legal parity, Sprint M21.S2).
 *
 * Hits Next.js API routes (under /api/v2/onboarding/*) that proxy a Railway.
 * Las rutas /api/v2/* deben crearse en app/api/v2/onboarding/route.ts (proxy).
 *
 * Tipos alineados con AgentRAGFullApp/backend/api/onboarding_v2.py.
 */

export type ColdStartQuestion = {
  key: string;
  q: string;
  required?: boolean;
  type?: 'string' | 'array' | 'boolean' | 'integer';
  default?: string;
};

export type ColdStartStatus = {
  session_id: string;
  status: 'in_progress' | 'ready_to_finish' | 'completed' | 'abandoned' | 'exhausted';
  current_part: number;
  total_parts: number;
  part_label?: string;
  questions?: ColdStartQuestion[];
  answers_so_far?: Record<string, unknown>;
  resumed?: boolean;
  next_action?: 'answer' | 'finish';
  message?: string;
};

export type CompanyProfile = {
  _exists: boolean;
  firm_id?: string;
  company_name?: string;
  legal_name?: string | null;
  nit?: string | null;
  industry?: string;
  practice_setting?: string;
  jurisdiction?: string;
  size_employees?: number | null;
  pain_points_md?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type PracticeArea = {
  section_id: string;
  area: string;
  is_primary: boolean;
  profile_md?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type SeedDoc = {
  seed_doc_id: string;
  title: string;
  area?: string | null;
  doc_type?: string | null;
  content_mime: string;
  size_bytes: number;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  created_at?: string;
  processed_at?: string | null;
};

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`onboarding API ${res.status}: ${detail || res.statusText}`);
  }
  return (await res.json()) as T;
}

// ─── Cold-start state machine ────────────────────────────────

export async function startColdStart(): Promise<ColdStartStatus> {
  const res = await fetch('/api/v2/onboarding/cold-start/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  });
  return jsonOrThrow<ColdStartStatus>(res);
}

export async function answerColdStart(
  session_id: string,
  answers: Record<string, unknown>,
): Promise<ColdStartStatus> {
  const res = await fetch('/api/v2/onboarding/cold-start/answer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ session_id, answers }),
  });
  return jsonOrThrow<ColdStartStatus>(res);
}

export async function getColdStartStatus(session_id: string): Promise<ColdStartStatus> {
  const res = await fetch(`/api/v2/onboarding/cold-start/${session_id}`, { cache: 'no-store' });
  return jsonOrThrow<ColdStartStatus>(res);
}

export async function finishColdStart(session_id: string): Promise<{
  session_id: string;
  status: 'completed' | 'already_completed';
  firms_profile_created?: boolean;
  practice_sections_inserted?: Array<{ area: string; section_id: string }>;
  message?: string;
}> {
  const res = await fetch(`/api/v2/onboarding/cold-start/${session_id}/finish`, { method: 'POST' });
  return jsonOrThrow(res);
}

export async function abandonColdStart(session_id: string): Promise<{ session_id: string; status: 'abandoned' }> {
  const res = await fetch(`/api/v2/onboarding/cold-start/${session_id}/abandon`, { method: 'POST' });
  return jsonOrThrow(res);
}

// ─── Seed docs ───────────────────────────────────────────────

export async function uploadSeedDoc(input: {
  title: string;
  area?: string;
  doc_type?: string;
  file: File;
  notes_md?: string;
}): Promise<{ seed_doc_id: string; title: string; size_bytes: number; status: string }> {
  const buf = await input.file.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const res = await fetch('/api/v2/onboarding/seed-docs/upload', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: input.title,
      area: input.area,
      doc_type: input.doc_type,
      content_base64: b64,
      content_mime: input.file.type || 'application/octet-stream',
      notes_md: input.notes_md,
    }),
  });
  return jsonOrThrow(res);
}

export async function listSeedDocs(): Promise<{ items: SeedDoc[]; total: number }> {
  const res = await fetch('/api/v2/onboarding/seed-docs', { cache: 'no-store' });
  return jsonOrThrow(res);
}

export async function deleteSeedDoc(doc_id: string): Promise<{ ok: boolean; seed_doc_id: string }> {
  const res = await fetch(`/api/v2/onboarding/seed-docs/${doc_id}`, { method: 'DELETE' });
  return jsonOrThrow(res);
}

// ─── Profile reads ──────────────────────────────────────────

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const res = await fetch('/api/v2/onboarding/company-profile', { cache: 'no-store' });
  return jsonOrThrow(res);
}

export async function getPracticeAreas(): Promise<{ items: PracticeArea[]; total: number }> {
  const res = await fetch('/api/v2/onboarding/practice-areas', { cache: 'no-store' });
  return jsonOrThrow(res);
}
