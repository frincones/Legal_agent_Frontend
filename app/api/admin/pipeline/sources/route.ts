/**
 * GET /api/admin/pipeline/sources
 *
 * Devuelve el progreso de ingesta por fuente:
 *  - total, pending, processing, completed, failed, skipped
 *  - pct_done, avg_seconds_per_doc, eta
 *  - last_error
 *
 * Proxy al backend /admin/pipeline/sources con fallback a mocked data.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MOCK_SOURCES } from '@/lib/admin/pipeline/mockData';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const useMock = process.env.MOCK_PIPELINE === 'true';

  if (useMock) {
    return NextResponse.json({ data: MOCK_SOURCES, source: 'mock' });
  }

  try {
    const res = await fetch(`${apiBase}/admin/pipeline/sources`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ data: MOCK_SOURCES, source: 'mock_fallback' });
    }

    const data = await res.json();
    return NextResponse.json({ data, source: 'backend' });
  } catch (err) {
    console.warn('[admin/pipeline/sources] fallback', err);
    return NextResponse.json({ data: MOCK_SOURCES, source: 'mock_fallback' });
  }
}
