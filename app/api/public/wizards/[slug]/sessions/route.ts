import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const xff = req.headers.get('x-forwarded-for');
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'user-agent': req.headers.get('user-agent') ?? 'lexai-frontend',
  };
  if (xff) headers['x-forwarded-for'] = xff;
  const body = await req.text();
  const res = await fetch(
    `${API_BASE}/v1/public/wizards/${encodeURIComponent(params.slug)}/sessions`,
    { method: 'POST', headers, body: body || '{}', cache: 'no-store' },
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
