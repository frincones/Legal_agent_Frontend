import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET latest completed extraction for a matter document. */
export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const res = await fetch(
    `${apiBase}/v1/matter-documents/${ctx.params.id}/analysis`,
    {
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
