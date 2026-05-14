import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const res = await fetch(
    `${API_BASE}/v1/public/wizards/sessions/${encodeURIComponent(params.token)}/generate`,
    { method: 'POST', cache: 'no-store' },
  );
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
