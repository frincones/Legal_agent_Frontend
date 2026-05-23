/**
 * POST /api/documents/[id]/export?format=pdf|docx|link
 *
 * Exporta el documento generado en distintos formatos.
 * Proxy al backend /v1/documents/{matter_document_id}/export.
 *
 * Response:
 *   - format=pdf:  application/pdf (download)
 *   - format=docx: application/vnd.openxmlformats-officedocument.wordprocessingml.document
 *   - format=link: { url: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'pdf';

  if (!['pdf', 'docx', 'link'].includes(format)) {
    return NextResponse.json({ error: 'invalid_format' }, { status: 400 });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

  try {
    const res = await fetch(`${apiBase}/v1/documents/${params.id}/export?format=${format}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${session.access_token}` },
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: 'backend_error', detail: text.slice(0, 300) }, { status: res.status });
    }

    if (format === 'link') {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Binary: forward content + content-type
    const blob = await res.blob();
    const headers = new Headers();
    headers.set('content-type', res.headers.get('content-type') ?? 'application/octet-stream');
    const disp = res.headers.get('content-disposition');
    if (disp) headers.set('content-disposition', disp);
    return new Response(blob, { status: 200, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'network_error', detail: msg }, { status: 503 });
  }
}
