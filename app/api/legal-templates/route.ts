import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET /api/legal-templates → lista de plantillas legales disponibles
 *  GET /api/legal-templates?kind=tutela → markdown de la plantilla específica
 *
 *  Proxy al backend Railway, que sabe cuáles tools/templates están registrados.
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind');
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const target = kind
    ? `${apiBase}/v1/legal-templates/${encodeURIComponent(kind)}`
    : `${apiBase}/v1/legal-templates`;
  const res = await fetch(target, {
    headers: { authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}
