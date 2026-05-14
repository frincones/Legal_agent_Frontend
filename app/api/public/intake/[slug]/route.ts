/**
 * Sprint 19 · Public intake proxy.
 *
 * Esta ruta es PÚBLICA · no requiere auth. Hace passthrough directo a
 * Railway sin agregar bearer token. Lo separamos del proxy genérico
 * que asume sesión Supabase.
 */
import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

async function passthrough(
  req: Request,
  slug: string,
  method: 'GET' | 'POST',
): Promise<NextResponse> {
  const headers: Record<string, string> = {
    'user-agent': req.headers.get('user-agent') ?? 'lexai-frontend',
    referer: req.headers.get('referer') ?? '',
  };
  const xff = req.headers.get('x-forwarded-for');
  if (xff) headers['x-forwarded-for'] = xff;
  let body: BodyInit | undefined;
  if (method === 'POST') {
    headers['content-type'] = req.headers.get('content-type') ?? 'application/json';
    body = await req.text();
  }
  const res = await fetch(`${API_BASE}/v1/public/intake/${encodeURIComponent(slug)}`, {
    method,
    headers,
    body,
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  return passthrough(req, params.slug, 'GET');
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  return passthrough(req, params.slug, 'POST');
}
