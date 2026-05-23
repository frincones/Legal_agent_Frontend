/**
 * PATCH /api/documents/[id]/sections/[key]
 *
 * Edita el contenido de una seccion individual (post-streaming).
 * Proxy al backend /v1/documents/{generation_id}/sections/{section_key}.
 *
 * Body: { content_md: string, revision_type: 'user_edit' | 'user_accept' | 'user_revert' }
 *
 * Side effect backend: INSERT en document_section_revisions con delta_chars.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; key: string } },
) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  if (process.env.NEXT_PUBLIC_DOC_GEN_V2_ENABLED !== 'true') {
    return NextResponse.json({ error: 'doc_gen_v2_disabled' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

  try {
    const res = await fetch(`${apiBase}/v1/documents/${params.id}/sections/${params.key}`, {
      method: 'PATCH',
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
