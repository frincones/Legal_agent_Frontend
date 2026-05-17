import { createClient } from '@/lib/supabase/server';

/**
 * Proxy SSE /api/multi-agent/generate/stream
 *   → backend /v1/multi-agent/generate/stream
 *
 * Same pattern as /api/skills/execute/stream · keeps body streaming intact.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

export async function POST(req: Request) {
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

  const body = await req.text();
  const upstream = await fetch(`${API_BASE}/v1/multi-agent/generate/stream`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
      accept: 'text/event-stream',
    },
    body,
    cache: 'no-store',
    // @ts-expect-error duplex required for streaming body in Node 18+
    duplex: 'half',
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    return new Response(
      JSON.stringify({
        error: `upstream ${upstream.status}`,
        detail: errText.slice(0, 200),
      }),
      { status: upstream.status || 502, headers: { 'content-type': 'application/json' } },
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}
