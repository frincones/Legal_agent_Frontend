/**
 * GET /api/admin/pipeline/status
 *
 * Proxy al backend Railway /admin/pipeline/status.
 * Devuelve el estado global del pipeline de ingesta:
 *  - health (healthy | degraded | critical)
 *  - workers activos
 *  - jobs queued/running/failed
 *  - docs ingestados
 *  - storage usage
 *  - costos
 *
 * Si el backend no responde o el flag MOCK_PIPELINE=true, devuelve
 * mocked data de lib/admin/pipeline/mockData para no romper la UI.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MOCK_GLOBAL } from '@/lib/admin/pipeline/mockData';

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
    return NextResponse.json({ data: MOCK_GLOBAL, source: 'mock' });
  }

  try {
    const res = await fetch(`${apiBase}/admin/pipeline/status`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn('[admin/pipeline/status] backend not ready, using mock', res.status);
      return NextResponse.json({ data: MOCK_GLOBAL, source: 'mock_fallback' });
    }

    const data = await res.json();
    return NextResponse.json({ data, source: 'backend' });
  } catch (err) {
    console.warn('[admin/pipeline/status] backend unreachable, using mock', err);
    return NextResponse.json({ data: MOCK_GLOBAL, source: 'mock_fallback' });
  }
}
