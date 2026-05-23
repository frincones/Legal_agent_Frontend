/**
 * GET /api/admin/pipeline/jobs
 *
 * Lista de jobs activos (running) + cronjobs programados:
 *  - running: workers procesando documentos en tiempo real
 *  - cron: jobs programados con APScheduler
 *
 * Proxy al backend /admin/pipeline/jobs con fallback a mocked data.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MOCK_RUNNING_JOBS, MOCK_CRON_JOBS } from '@/lib/admin/pipeline/mockData';

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
    return NextResponse.json({
      data: { running: MOCK_RUNNING_JOBS, cron: MOCK_CRON_JOBS },
      source: 'mock',
    });
  }

  try {
    const res = await fetch(`${apiBase}/admin/pipeline/jobs`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({
        data: { running: MOCK_RUNNING_JOBS, cron: MOCK_CRON_JOBS },
        source: 'mock_fallback',
      });
    }

    const data = await res.json();
    return NextResponse.json({ data, source: 'backend' });
  } catch (err) {
    console.warn('[admin/pipeline/jobs] fallback', err);
    return NextResponse.json({
      data: { running: MOCK_RUNNING_JOBS, cron: MOCK_CRON_JOBS },
      source: 'mock_fallback',
    });
  }
}
