import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

export async function GET(req: Request) {
  const headers: Record<string, string> = {
    'user-agent': req.headers.get('user-agent') ?? 'lexai-frontend',
  };
  const res = await fetch(`${API_BASE}/v1/billing/plans`, { headers, cache: 'no-store' });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
