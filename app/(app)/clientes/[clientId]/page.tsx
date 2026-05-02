import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { CasesTable, type CaseTableRow } from '@/components/cases/CasesTable';
import { fetchClient, type Matter } from '@/lib/api/rsc-fetchers';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatRelative } from '@/lib/utils';
import { notFound } from 'next/navigation';

export const revalidate = 30;

export default async function ClienteDetallePage({ params }: { params: { clientId: string } }) {
  const c = await fetchClient(params.clientId);
  if (!c) return notFound();

  const supabase = createClient();
  const [mattersRes, voiceRes] = await Promise.all([
    supabase
      .from('matters')
      .select('id, display_id, titulo, materia, etapa_procesal, tribunal, expediente, status, priority, proxima_fecha, proxima_tipo, cuantia, pendientes, is_demo, created_at, updated_at, client_id')
      .eq('client_id', c.id)
      .neq('status', 'archivado')
      .order('priority', { ascending: true }),
    supabase
      .from('voice_sessions')
      .select('duration_ms, started_at, utterances')
      .order('started_at', { ascending: false })
      .limit(3),
  ]);

  const matters = (mattersRes.data ?? []) as Matter[];
  const voiceComms = (voiceRes.data ?? []) as Array<{ duration_ms: number; started_at: string; utterances: number }>;

  const initials = c.nombre.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const idLabel = c.tax_id ?? c.personal_id ?? '';
  const idTipo = c.tax_id ? 'NIT' : c.personal_id ? 'Cédula' : 'ID';

  return (
    <AppShell active="clientes">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Clientes / Activos"
          title={c.nombre}
          subtitle={
            <>
              {idTipo} {idLabel} · cliente desde {c.created_at ? formatDate(c.created_at) : '—'} ·{' '}
              <span className="chip chip-green ml-1">{matters.length} caso{matters.length !== 1 ? 's' : ''} activo{matters.length !== 1 ? 's' : ''}</span>
            </>
          }
          actions={
            <>
              <button className="btn">{Ic.msg} Mensaje</button>
              <button className="btn">{Ic.cal} Agendar</button>
              <button className="btn btn-primary">{Ic.plus} Nuevo caso</button>
            </>
          }
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[320px_1fr]">
            <aside className="flex flex-col gap-3">
              <section className="surface p-[var(--pad-card)] text-center">
                <div
                  className="mx-auto mb-3 grid h-[80px] w-[80px] place-items-center rounded-full text-[24px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, rgb(var(--accent-rgb)), rgb(var(--purple-rgb)))' }}
                >
                  {initials}
                </div>
                <h3 className="serif m-0 text-[18px] -tracking-[0.01em]">{c.nombre}</h3>
                <div className="mt-[2px] text-[12px] muted">
                  {c.tipo === 'persona_juridica' ? 'Persona jurídica' : 'Persona natural'}
                </div>
                <div className="mt-3 flex justify-center gap-2">
                  {c.vip && <span className="chip chip-blue">VIP</span>}
                  <span className="chip">
                    <span className="dot bg-ok" />
                    Al día
                  </span>
                </div>
              </section>

              <section className="surface p-[var(--pad-card)]">
                <h4 className="serif m-[0_0_10px] text-[14px] font-semibold">Datos</h4>
                {[
                  ['Email', c.email ?? '—'],
                  ['Teléfono', c.telefono ?? '—'],
                  [idTipo, idLabel],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between border-b border-dashed border-line py-[6px] text-[12.5px] last:border-0"
                  >
                    <span className="muted">{k}</span>
                    <span className="text-right font-medium">{v}</span>
                  </div>
                ))}
              </section>

              <section className="surface p-[var(--pad-card)]" style={{ background: 'rgb(var(--bg-sunken-rgb))' }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex text-ok">{Ic.shield}</span>
                  <h4 className="serif m-0 text-[14px] font-semibold">Habeas Data · Ley 1581/2012</h4>
                </div>
                <div className="text-[11.5px] leading-relaxed muted">
                  Último consentimiento:{' '}
                  <b className="text-ink">
                    {c.consent_lfpdppp_at ? formatDate(c.consent_lfpdppp_at) : 'no firmado'}
                  </b>
                  . Finalidades: representación legal, contacto, cobranza. Grabación voz:{' '}
                  <b className={c.consent_voice_recording ? 'text-ok' : 'text-warn'}>
                    {c.consent_voice_recording ? 'autorizada' : 'no autorizada'}
                  </b>
                  . Derechos ARCO disponibles.
                </div>
              </section>
            </aside>

            <div className="flex flex-col gap-4">
              <section className="surface p-[var(--pad-card)]">
                <h3 className="serif m-0 text-[16px] font-semibold">
                  Casos activos ({matters.length})
                </h3>
                <div className="mt-3">
                  {matters.length === 0 ? (
                    <div className="text-[12.5px] muted">Sin casos activos.</div>
                  ) : (
                    <CasesTable rows={matters.map(matterToRow)} />
                  )}
                </div>
              </section>

              <section className="surface p-[var(--pad-card)]">
                <h3 className="serif m-0 text-[16px] font-semibold">Comunicaciones recientes</h3>
                <div className="mt-3 flex flex-col">
                  {voiceComms.length > 0
                    ? voiceComms.map((v, i) => (
                        <Comm
                          key={i}
                          icon={Ic.mic}
                          when={formatRelative(v.started_at)}
                          h={`Sesión de voz · ${v.utterances} intervenciones · ${Math.round(v.duration_ms / 1000)}s`}
                          sub="Grabada con consentimiento del cliente"
                        />
                      ))
                    : (
                        <Comm icon={Ic.msg} when="—" h="Sin comunicaciones registradas" sub="Las próximas llamadas y emails aparecerán aquí." />
                      )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function matterToRow(m: Matter): CaseTableRow {
  const fechaFmt = m.proxima_fecha
    ? new Date(m.proxima_fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Sin fecha';
  return {
    id: m.id,
    display_id: m.display_id,
    cliente: '',
    titulo: m.titulo,
    materia: m.materia.charAt(0).toUpperCase() + m.materia.slice(1),
    etapa: m.etapa_procesal ?? '',
    tribunal: m.tribunal ?? '',
    expediente: m.expediente ?? '',
    proxima: fechaFmt,
    proxima_tipo: m.proxima_tipo ?? '',
    dias_restantes: m.proxima_fecha
      ? Math.round((new Date(m.proxima_fecha).getTime() - Date.now()) / (24 * 3600 * 1000))
      : null,
    owner: 'Lic. Álvarez',
    prioridad: m.priority,
    pendientes: m.pendientes,
    docs: 0,
    ultimo: '',
  };
}

function Comm({
  icon, when, h, sub,
}: {
  icon: React.ReactNode; when: string; h: string; sub: string;
}) {
  return (
    <div className="flex gap-3 border-b border-line py-[10px] last:border-0">
      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-md bg-bg-sunken text-ink-2">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{h}</div>
        <div className="mt-[2px] text-[11.5px] muted">{sub}</div>
      </div>
      <div className="text-[11.5px] muted">{when}</div>
    </div>
  );
}
