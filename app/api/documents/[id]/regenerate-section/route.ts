/**
 * POST /api/documents/[id]/regenerate-section
 *
 * Regenera una seccion especifica del documento (con SSE streaming).
 * Proxy al backend /v1/documents/{generation_id}/regenerate-section.
 *
 * Body: { section_key: string, instructions?: string }
 * Response: SSE con events section_delta + section_done
 */
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (process.env.NEXT_PUBLIC_DOC_GEN_V2_ENABLED !== 'true') {
    return new Response(JSON.stringify({ error: 'doc_gen_v2_disabled' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

  try {
    const upstream = await fetch(`${apiBase}/v1/documents/${params.id}/regenerate-section`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal: req.signal,
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'backend_error', status: upstream.status, detail: text.slice(0, 300) }), {
        status: upstream.status,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: 'network_error', detail: msg }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
}
