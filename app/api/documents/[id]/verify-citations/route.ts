/**
 * POST /api/documents/[id]/verify-citations
 *
 * Re-verifica todas las citas del documento (batch post-generacion).
 * Proxy al backend /v1/documents/{matter_document_id}/verify-citations.
 *
 * Response: { citation_rate, verified, suspicious, not_found }
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

  try {
    const res = await fetch(`${apiBase}/v1/documents/${params.id}/verify-citations`, {
      method: 'POST',
      headers: { authorization: `Bearer ${session.access_token}` },
      signal: AbortSignal.timeout(45000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'network_error', detail: msg }, { status: 503 });
  }
}
