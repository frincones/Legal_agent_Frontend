/**
 * GET /api/assistant/threads
 *
 * Lista los threads (hilos) de conversación del asistente para el firm actual.
 *
 * NOTA: el backend de LexAI NO expone (al dia de hoy) un endpoint que
 * agrupe skill_executions por session_id y devuelva titulo + timestamp.
 * El listado de hilos se construye client-side desde localStorage (ver
 * lib/v2/threadIndex.ts y components/v2/shell/SidebarHilosList.tsx).
 *
 * Este endpoint queda como fallback: devuelve { threads: [] } siempre, o
 * con ?raw=1 expone el shape crudo de /v1/skills/executions para debug.
 * Cuando el backend exponga /v1/threads con la forma correcta, este
 * endpoint puede empezar a poblar la lista y el sidebar lo consumira.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface SkillExecutionRow {
  id?: string;
  session_id?: string | null;
  command?: string | null;
  input?: Record<string, unknown> | null;
  prompt?: string | null;
  created_at?: string | null;
  ts?: string | null;
}

interface Thread {
  id: string;
  title: string;
  created_at: string;
}

function pickPrompt(row: SkillExecutionRow): string {
  if (typeof row.prompt === 'string' && row.prompt.trim()) return row.prompt.trim();
  const input = row.input ?? {};
  for (const k of ['prompt', 'message', 'text', 'query']) {
    const v = (input as Record<string, unknown>)[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return row.command ?? 'Hilo sin título';
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';
  const debug = req.nextUrl.searchParams.get('raw') === '1';

  try {
    const res = await fetch(`${apiBase}/v1/skills/executions?limit=200`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[threads proxy] executions error', res.status, errText.slice(0, 300));
      return NextResponse.json({ threads: [], _upstream_status: res.status });
    }

    const data = await res.json();
    if (debug) {
      // Devolver shape crudo y primeras 3 filas con todas las llaves para diagnóstico
      const sample = Array.isArray(data) ? data.slice(0, 3) : data;
      return NextResponse.json({ _raw_shape: typeof data, _keys: Array.isArray(data) ? null : Object.keys(data ?? {}), _sample: sample });
    }
    const rows: SkillExecutionRow[] = Array.isArray(data)
      ? data
      : (Array.isArray(data?.executions) ? data.executions : Array.isArray(data?.items) ? data.items : []);

    // Agrupar por session_id. Si una fila no trae session_id la consideramos
    // hilo individual (id propio) para no descartarla.
    const grouped = new Map<string, { rows: SkillExecutionRow[]; latestTs: number }>();
    for (const r of rows) {
      const key = r.session_id || r.id || `anon-${Math.random()}`;
      const ts = r.created_at || r.ts || null;
      const tsMs = ts ? new Date(ts).getTime() : 0;
      const existing = grouped.get(key);
      if (existing) {
        existing.rows.push(r);
        if (tsMs > existing.latestTs) existing.latestTs = tsMs;
      } else {
        grouped.set(key, { rows: [r], latestTs: tsMs });
      }
    }

    const threads: Thread[] = Array.from(grouped.entries()).map(([key, { rows: groupRows, latestTs }]) => {
      // El primer prompt del hilo cronologicamente = titulo amigable
      const sorted = [...groupRows].sort((a, b) => {
        const ta = new Date(a.created_at || a.ts || 0).getTime();
        const tb = new Date(b.created_at || b.ts || 0).getTime();
        return ta - tb;
      });
      const firstRow = sorted[0] ?? groupRows[0];
      const firstPrompt = firstRow ? pickPrompt(firstRow) : 'Hilo sin titulo';
      const title = firstPrompt.length > 60 ? `${firstPrompt.slice(0, 57)}...` : firstPrompt;
      return {
        id: key,
        title,
        created_at: latestTs ? new Date(latestTs).toISOString() : new Date().toISOString(),
      };
    });

    // Más recientes primero
    threads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ threads });
  } catch (err) {
    console.error('[threads proxy] network error', err);
    return NextResponse.json({ threads: [], _network_error: String(err) });
  }
}
