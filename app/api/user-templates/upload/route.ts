import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** POST /api/user-templates/upload — multipart/form-data passthrough.
 *
 * Cannot use proxyToRailway because the generic helper assumes JSON.
 * We forward the raw FormData to Railway preserving multipart boundaries.
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
  // Re-emit the same body and content-type (multipart with boundary).
  const ct = req.headers.get('content-type') ?? 'multipart/form-data';
  const upstream = await fetch(`${apiBase}/v1/user-templates/upload`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': ct,
    },
    body: req.body,
    cache: 'no-store',
    // @ts-expect-error · runtime-only flag
    duplex: 'half',
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
