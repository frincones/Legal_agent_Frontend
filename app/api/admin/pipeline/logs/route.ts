/**
 * GET /api/admin/pipeline/logs
 *
 * Logs recientes del pipeline (max 200 entradas).
 * Soporta query params:
 *   ?level=info|warn|error
 *   ?source=corte_cc|...
 *   ?limit=200
 *
 * Proxy al backend /admin/pipeline/logs con fallback a mocked data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MOCK_LOGS } from '@/lib/admin/pipeline/mockData';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level');
  const source = searchParams.get('source');
  const limit = parseInt(searchParams.get('limit') ?? '200', 10);

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const useMock = process.env.MOCK_PIPELINE === 'true';

  if (useMock) {
    let filtered = MOCK_LOGS;
    if (level) filtered = filtered.filter((l) => l.level === level);
    if (source) filtered = filtered.filter((l) => l.source === source);
    return NextResponse.json({ data: filtered.slice(0, limit), source: 'mock' });
  }

  try {
    const url = new URL(`${apiBase}/admin/pipeline/logs`);
    if (level) url.searchParams.set('level', level);
    if (source) url.searchParams.set('source', source);
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ data: MOCK_LOGS.slice(0, limit), source: 'mock_fallback' });
    }

    const data = await res.json();
    return NextResponse.json({ data, source: 'backend' });
  } catch (err) {
    console.warn('[admin/pipeline/logs] fallback', err);
    return NextResponse.json({ data: MOCK_LOGS.slice(0, limit), source: 'mock_fallback' });
  }
}
