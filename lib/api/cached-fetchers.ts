/**
 * Cached shell-data fetcher.
 *
 * Reads the user's session BEFORE entering the cached function (cookies()
 * is request-bound and can't be inside unstable_cache). Then queries with
 * the service role and explicit firm_id filter — bypasses RLS so we
 * don't need to forward the JWT into the cache layer.
 */
import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { getSessionPrincipal } from '@/lib/supabase/session';

type CachedFirm = {
  user_id: string;
  firm_id: string;
  razon_social: string;
  user_full_name: string;
  user_cedula: string;
  user_role: string;
  modo_ejercicio: string | null;
  practice_areas: string[];
  primary_area: string | null;
};

export async function getCachedShellData(): Promise<{
  firm: CachedFirm | null;
  nsm: { documentos: number; meta: number; deltaPct: number; voiceWeek: number; horasMes: number };
  counts: { matters: number; clients: number; hitl: number; deadlines7d: number; judicial: number };
}> {
  const principal = await getSessionPrincipal();
  if (!principal || !principal.firm_id) {
    return {
      firm: null,
      nsm: { documentos: 0, meta: 40, deltaPct: 0, voiceWeek: 0, horasMes: 0 },
      counts: { matters: 0, clients: 0, hitl: 0, deadlines7d: 0, judicial: 0 },
    };
  }
  return _shellDataCached(principal.user_id, principal.firm_id);
}

const _shellDataCached = unstable_cache(
  async (userId: string, firmId: string) => {
    // Service-role client · bypasses RLS · safe because we filter explicitly.
    const supabase = createServiceClient();
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const [profileRes, firmRes, thisMonth, lastMonth, weekData, mattersC, clientsC, hitlC, deadlinesC, judicialC, areasRes] =
      await Promise.all([
        supabase.from('users').select('full_name, cedula_profesional, role, modo_ejercicio').eq('id', userId).single(),
        supabase.from('firms').select('razon_social').eq('id', firmId).single(),
        supabase.from('nsm_daily').select('documentos_verificados, voice_commands, horas_ahorradas').eq('firm_id', firmId).gte('day', thisMonthStart),
        supabase.from('nsm_daily').select('documentos_verificados').eq('firm_id', firmId).gte('day', lastMonthStart).lt('day', thisMonthStart),
        supabase.from('nsm_daily').select('voice_commands').eq('firm_id', firmId).gte('day', sevenDaysAgo),
        supabase.from('matters').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).neq('status', 'archivado'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('firm_id', firmId),
        supabase.from('hitl_interrupts').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).eq('decision', 'pending'),
        supabase.from('matter_deadlines').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).eq('completado', false).lte('fecha', sevenDaysFromNow),
        supabase.from('judicial_notifications').select('*', { count: 'exact', head: true }).eq('firm_id', firmId).eq('status', 'unread'),
        supabase.from('user_practice_areas').select('area, is_primary').eq('user_id', userId),
      ]);

    const profile = profileRes.data as {
      full_name: string;
      cedula_profesional: string | null;
      role: string;
      modo_ejercicio: string | null;
    } | null;
    const firm = firmRes.data as { razon_social: string } | null;
    const areasRows = (areasRes.data ?? []) as Array<{ area: string; is_primary: boolean | null }>;
    const practice_areas = areasRows.map((r) => r.area);
    const primary_area = areasRows.find((r) => r.is_primary)?.area ?? null;

    const docsThis = (thisMonth.data ?? []).reduce((s, r) => s + (r.documentos_verificados ?? 0), 0);
    const docsLast = (lastMonth.data ?? []).reduce((s, r) => s + (r.documentos_verificados ?? 0), 0);
    const horasThis = (thisMonth.data ?? []).reduce((s, r) => s + Number(r.horas_ahorradas ?? 0), 0);
    const voiceWeek = (weekData.data ?? []).reduce((s, r) => s + (r.voice_commands ?? 0), 0);

    return {
      firm: profile
        ? {
            user_id: userId,
            firm_id: firmId,
            razon_social: firm?.razon_social ?? 'Despacho',
            user_full_name: profile.full_name,
            user_cedula: profile.cedula_profesional ?? '',
            user_role: profile.role,
            modo_ejercicio: profile.modo_ejercicio,
            practice_areas,
            primary_area,
          }
        : null,
      nsm: {
        documentos: docsThis,
        meta: 40,
        deltaPct: docsLast > 0 ? Math.round(((docsThis - docsLast) / docsLast) * 100) : 0,
        voiceWeek,
        horasMes: Math.round(horasThis),
      },
      counts: {
        matters: mattersC.count ?? 0,
        clients: clientsC.count ?? 0,
        hitl: hitlC.count ?? 0,
        deadlines7d: deadlinesC.count ?? 0,
        judicial: judicialC.count ?? 0,
      },
    };
  },
  ['shell-data-v4'],
  { revalidate: 60, tags: ['shell-data'] },
);
