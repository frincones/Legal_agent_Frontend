import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** POST /api/conciliacion/verify
 *  Body: { nombre: string, ciudad?: string }
 *  → Forwards to Railway /v1/conciliacion/verify (Sprint L10)
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }

  const nombre = (body as { nombre?: unknown }).nombre;
  if (typeof nombre !== 'string' || nombre.length < 3) {
    return NextResponse.json(
      { error: 'nombre must be a string (min 3 chars)' },
      { status: 400 },
    );
  }
  const ciudad = (body as { ciudad?: unknown }).ciudad;

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const res = await fetch(`${apiBase}/v1/conciliacion/verify`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      nombre,
      ...(typeof ciudad === 'string' && ciudad ? { ciudad } : {}),
    }),
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
