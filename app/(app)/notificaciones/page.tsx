import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { fetchHITLPending } from '@/lib/api/rsc-fetchers';
import { createClient } from '@/lib/supabase/server';
import { formatRelative } from '@/lib/utils';
import { Ic } from '@/components/atoms/icons';
import { JudicialInbox, type JudicialNotif } from '@/components/notificaciones/JudicialInbox';

export const revalidate = 30;

const KIND_META: Record<string, { color: string; label: string; icon: keyof typeof Ic }> = {
  email_externo: { color: 'chip-amber', label: 'Email externo', icon: 'send' },
  firma_digital: { color: 'chip-red', label: 'Firma digital', icon: 'shield' },
  cita_jurisprudencia: { color: 'chip-blue', label: 'Cita jurisprudencia', icon: 'scales' },
  accion_financiera: { color: 'chip-amber', label: 'Acción financiera', icon: 'badge' },
  sobrescribir: { color: 'chip-amber', label: 'Sobrescribir documento', icon: 'edit' },
  escrito_juzgado: { color: 'chip-amber', label: 'Escrito a juzgado', icon: 'doc' },
  dato_sensible_habeas_data: { color: 'chip-blue', label: 'Datos sensibles', icon: 'shield' },
};

export default async function NotificacionesPage() {
  const pending = await fetchHITLPending();

  const supabase = createClient();
  const [runsRes, judicialRes] = await Promise.all([
    supabase
      .from('agent_runs')
      .select('id, intent, user_input, started_at, citations_count, citations_verified_count')
      .order('started_at', { ascending: false })
      .limit(10),
    supabase
      .from('judicial_notifications')
      .select('id, matter_id, fuente, titulo, resumen, url_oficial, fecha_publicacion, fecha_actuacion, expediente, juzgado, tipo, severidad, status, created_at, read_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  const recentRuns = runsRes.data;
  const judicialItems = (judicialRes.data ?? []) as JudicialNotif[];

  return (
    <AppShell active="inbox">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Notificaciones"
          title="Bandeja de entrada"
          subtitle={`${pending.length} confirmaciones pendientes · actividad LexAI`}
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mb-6">
            <JudicialInbox items={judicialItems} />
          </div>

          <section className="mb-6">
            <h3 className="serif mb-2 text-[16px] font-semibold">
              Aprobaciones pendientes (HITL)
            </h3>
            {pending.length === 0 ? (
              <div className="surface p-6 text-center muted">
                Sin aprobaciones pendientes. LexAI te notificará aquí cuando una acción del agente requiera tu confirmación.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map((p) => {
                  const meta = KIND_META[p.kind] ?? { color: 'chip', label: p.kind, icon: 'shield' as keyof typeof Ic };
                  return (
                    <article key={p.id} className="surface flex items-start gap-4 p-[var(--pad-card)]">
                      <span className="grid h-[36px] w-[36px] flex-none place-items-center rounded-md bg-bg-sunken">
                        {Ic[meta.icon]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`chip ${meta.color}`}>{meta.label}</span>
                          <span className="text-[11.5px] muted">{formatRelative(p.created_at)}</span>
                        </div>
                        <pre className="mt-2 max-h-[120px] overflow-auto rounded-md bg-bg-sunken p-2 mono text-[11px] leading-snug">
                          {JSON.stringify(p.payload, null, 2)}
                        </pre>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button className="btn btn-sm">Rechazar</button>
                        <button className="btn btn-sm">Editar</button>
                        <button className="btn btn-sm btn-primary">Aprobar</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h3 className="serif mb-2 text-[16px] font-semibold">Actividad reciente del agente</h3>
            <div className="surface p-[var(--pad-card)]">
              {(recentRuns ?? []).length === 0 ? (
                <div className="muted text-[12.5px]">Sin actividad reciente.</div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {(recentRuns ?? []).map((r) => {
                    const run = r as { id: string; intent: string; user_input: string; started_at: string; citations_count: number; citations_verified_count: number };
                    return (
                      <li key={run.id} className="flex items-start gap-3 border-b border-line pb-3 last:border-0">
                        <span className="dot bg-purple mt-2" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium">{run.user_input}</div>
                          <div className="text-[11.5px] muted">
                            {run.intent} · {run.citations_verified_count}/{run.citations_count} citas verificadas
                          </div>
                        </div>
                        <span className="text-[11.5px] muted">{formatRelative(run.started_at)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
