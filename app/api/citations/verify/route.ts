import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** POST /api/citations/verify
 *  Body: { citation_refs: string[] }
 *  → Forwards to Railway /v1/citations/verify
 *
 *  Browser → this route → Railway. Auth via Supabase session cookie;
 *  the access_token is forwarded as Bearer to Railway.
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

  const refs = (body as { citation_refs?: unknown }).citation_refs;
  if (!Array.isArray(refs) || refs.some((r) => typeof r !== 'string')) {
    return NextResponse.json(
      { error: 'citation_refs must be string[]' },
      { status: 400 },
    );
  }
  if (refs.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const res = await fetch(`${apiBase}/v1/citations/verify`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ citation_refs: refs }),
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
