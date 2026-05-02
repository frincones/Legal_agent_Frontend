import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const inUrl = new URL(req.url);
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const target = `${apiBase}/v1/notifications/judicial?${inUrl.searchParams.toString()}`;
  const res = await fetch(target, {
    headers: { authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
