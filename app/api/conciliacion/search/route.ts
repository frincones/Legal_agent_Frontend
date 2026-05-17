import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET /api/conciliacion/search?ciudad=&entidad=&nombre=&estado=
 *  → Forwards to Railway /v1/conciliacion/search (Sprint L10 - centros conciliacion)
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const target = `${apiBase}/v1/conciliacion/search${qs ? `?${qs}` : ''}`;

  const res = await fetch(target, {
    method: 'GET',
    headers: { authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
