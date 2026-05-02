/**
 * RSC fetchers that go directly to Supabase via @supabase/ssr.
 * Use for read-only data scoped by RLS (no need to roundtrip Railway).
 */

import { createClient } from '@/lib/supabase/server';

export type NSMSnapshot = {
  documentos_verificados_mes: number;
  documentos_meta_mes: number;
  delta_pct: number;
  voice_commands_semana: number;
  horas_ahorradas_mes: number;
  citas_verificadas_pct: number;
};

export async function fetchNSM(): Promise<NSMSnapshot> {
  const supabase = createClient();
  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const { data: thisMonth } = await supabase
    .from('nsm_daily')
    .select('documentos_verificados, voice_commands, horas_ahorradas')
    .gte('day', thisMonthStart);
  const { data: lastMonth } = await supabase
    .from('nsm_daily')
    .select('documentos_verificados')
    .gte('day', lastMonthStart)
    .lt('day', thisMonthStart);
  const { data: weekData } = await supabase
    .from('nsm_daily')
    .select('voice_commands')
    .gte('day', sevenDaysAgo);

  const docsThis = (thisMonth ?? []).reduce((s, r) => s + (r.documentos_verificados ?? 0), 0);
  const docsLast = (lastMonth ?? []).reduce((s, r) => s + (r.documentos_verificados ?? 0), 0);
  const horasThis = (thisMonth ?? []).reduce((s, r) => s + Number(r.horas_ahorradas ?? 0), 0);
  const voiceWeek = (weekData ?? []).reduce((s, r) => s + (r.voice_commands ?? 0), 0);

  return {
    documentos_verificados_mes: docsThis,
    documentos_meta_mes: 40,
    delta_pct: docsLast > 0 ? Math.round(((docsThis - docsLast) / docsLast) * 100) : 0,
    voice_commands_semana: voiceWeek,
    horas_ahorradas_mes: Math.round(horasThis),
    citas_verificadas_pct: 100,
  };
}

export type FirmInfo = {
  razon_social: string;
  user_full_name: string;
  user_cedula: string;
  user_role: string;
};

export async function fetchFirmInfo(): Promise<FirmInfo | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, cedula_profesional, role, firm_id')
    .eq('id', user.id)
    .single();
  if (!profile) return null;

  const { data: firm } = await supabase
    .from('firms')
    .select('razon_social')
    .eq('id', profile.firm_id)
    .single();

  return {
    razon_social: firm?.razon_social ?? 'Despacho',
    user_full_name: profile.full_name,
    user_cedula: profile.cedula_profesional ?? '',
    user_role: profile.role,
  };
}

export async function countMatters(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('matters')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'archivado');
  return count ?? 0;
}

export async function countClients(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });
  return count ?? 0;
}

export async function countPendingHITL(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('hitl_interrupts')
    .select('*', { count: 'exact', head: true })
    .eq('decision', 'pending');
  return count ?? 0;
}

export async function countOpenDeadlinesNext7d(): Promise<number> {
  const supabase = createClient();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from('matter_deadlines')
    .select('*', { count: 'exact', head: true })
    .eq('completado', false)
    .lte('fecha', sevenDaysFromNow);
  return count ?? 0;
}
