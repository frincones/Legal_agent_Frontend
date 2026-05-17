import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** POST /api/predios/verify
 *  Body: { cedula_catastral: string }
 *  → Forwards to Railway /v1/predios/verify (Sprint L8 - IGAC + Catastro Bogota)
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

  const cedula = (body as { cedula_catastral?: unknown }).cedula_catastral;
  if (typeof cedula !== 'string' || cedula.length < 5) {
    return NextResponse.json(
      { error: 'cedula_catastral must be a string (min 5 chars)' },
      { status: 400 },
    );
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const res = await fetch(`${apiBase}/v1/predios/verify`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ cedula_catastral: cedula }),
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
