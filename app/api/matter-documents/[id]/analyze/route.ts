import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Proxy POST /v1/matter-documents/{id}/analyze on Railway with user JWT. */
export async function POST(req: Request, ctx: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const url = new URL(req.url);
  const regenerate = url.searchParams.get('regenerate') === '1' ? '?regenerate=true' : '';
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const res = await fetch(
    `${apiBase}/v1/matter-documents/${ctx.params.id}/analyze${regenerate}`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    },
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
