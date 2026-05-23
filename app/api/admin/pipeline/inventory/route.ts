/**
 * GET /api/admin/pipeline/inventory
 *
 * Inventario completo del corpus:
 *  - total documentos / chunks / templates / sentencias / normas
 *  - storage usage (Postgres + R2)
 *  - costo acumulado de embeddings
 *  - desglose por (source, doc_type, materia)
 *
 * Proxy al backend /admin/pipeline/inventory con fallback a mocked data.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MOCK_INVENTORY } from '@/lib/admin/pipeline/mockData';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const useMock = process.env.MOCK_PIPELINE === 'true';

  if (useMock) {
    return NextResponse.json({ data: MOCK_INVENTORY, source: 'mock' });
  }

  try {
    const res = await fetch(`${apiBase}/admin/pipeline/inventory`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({ data: MOCK_INVENTORY, source: 'mock_fallback' });
    }

    const data = await res.json();
    return NextResponse.json({ data, source: 'backend' });
  } catch (err) {
    console.warn('[admin/pipeline/inventory] fallback', err);
    return NextResponse.json({ data: MOCK_INVENTORY, source: 'mock_fallback' });
  }
}
