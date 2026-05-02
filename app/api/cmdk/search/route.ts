import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

/** Search hits via Postgres RPC `lexai_cmdk_search(q, lim)` · single
 *  roundtrip · accent-insensitive (unaccent) · trigram indexed.
 *  Returns { matters, clients, documents, sentencias } · <300ms target.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ matters: [], clients: [], documents: [], sentencias: [] });
  }

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('lexai_cmdk_search', { q, lim: 6 });
  if (error) {
    console.error('[cmdk] rpc error:', error);
    return NextResponse.json(
      { matters: [], clients: [], documents: [], sentencias: [], _error: error.message },
      { status: 200 },
    );
  }

  return NextResponse.json(
    data ?? { matters: [], clients: [], documents: [], sentencias: [] },
    { headers: { 'cache-control': 'private, max-age=15' } },
  );
}
