/**
 * POST /api/documents/[id]/rate
 *
 * Registra rating del usuario (1-5) + feedback opcional sobre el documento.
 * Proxy al backend /v1/documents/{matter_document_id}/rate.
 *
 * Body: { rating: 1|2|3|4|5, feedback_md?: string }
 *
 * Side effect: INSERT en document_quality_scores.user_rating + actualiza
 * template_usage_stats.user_ratings_sum/count para mejorar ranking.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: { rating?: number; feedback_md?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'invalid_rating', detail: 'rating must be 1-5' }, { status: 422 });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

  try {
    const res = await fetch(`${apiBase}/v1/documents/${params.id}/rate`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'network_error', detail: msg }, { status: 503 });
  }
}
