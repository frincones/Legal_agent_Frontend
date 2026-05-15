import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

export async function POST(req: Request) {
  const body = await req.text();
  const res = await fetch(`${API_BASE}/v1/public/arco-requests`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': req.headers.get('x-forwarded-for') ?? '',
      'user-agent': req.headers.get('user-agent') ?? '',
    },
    body,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
