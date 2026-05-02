import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Proxy POST /v1/calc/prescripcion → Railway backend with user JWT. */
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const body = await req.text();
  const res = await fetch(`${apiBase}/v1/calc/prescripcion`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body,
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
