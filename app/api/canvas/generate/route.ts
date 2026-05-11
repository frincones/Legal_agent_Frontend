import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** POST /api/canvas/generate — streams NDJSON from Railway.
 *
 * Cannot use the generic proxyToRailway helper because it consumes the
 * upstream response with `.text()` (sync). Streaming responses must be
 * piped body-to-body so the editor sees tokens in real time.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const upstream = await fetch(`${apiBase}/v1/canvas/generate`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body: await req.text(),
    cache: 'no-store',
    // @ts-expect-error · runtime-only flag, not in lib.dom typings
    duplex: 'half',
  });
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return new NextResponse(text || 'upstream error', {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'application/x-ndjson',
      'cache-control': 'no-store, no-transform',
      'x-accel-buffering': 'no',
    },
  });
}
