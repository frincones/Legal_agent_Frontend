import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const form = await req.formData();
  const upstream = new FormData();
  for (const [k, v] of form.entries()) upstream.append(k, v as Blob | string);
  const res = await fetch(`${API_BASE}/v1/imports/upload`, {
    method: 'POST',
    headers: { authorization: `Bearer ${session.access_token}` },
    body: upstream,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
