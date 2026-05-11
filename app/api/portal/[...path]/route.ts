import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

/**
 * Portal público — sin Supabase auth. Reenvía a /v1/portal/{token}/...
 * Solo lectura. El token es la única credencial.
 */
export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  const url = new URL(req.url);
  const path = (params.path || []).join('/');
  const target = `${API_BASE}/v1/portal/${path}${url.search}`;
  const res = await fetch(target, { cache: 'no-store' });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
