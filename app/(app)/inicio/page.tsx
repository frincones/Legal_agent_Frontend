import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { CasesTable } from '@/components/cases/CasesTable';
import {
  InicioTopActions,
  GreetingActions,
  UrgentCardActions,
  DofCardActions,
  QuickActionButton,
} from '@/components/inicio/InicioActions';
import { fetchMatters } from '@/lib/api/rsc-fetchers';
import { getCachedShellData } from '@/lib/api/cached-fetchers';
import { formatCOP, cn } from '@/lib/utils';

export const revalidate = 30;

export default async function InicioPage() {
  // Shell data is already cached by AppShell · we reuse it here.
  const [matters, shell] = await Promise.all([
    fetchMatters({ limit: 50 }),
    getCachedShellData(),
  ]);
  const firm = shell.firm;
  const nsm = {
    documentos_verificados_mes: shell.nsm.documentos,
    documentos_meta_mes: shell.nsm.meta,
    delta_pct: shell.nsm.deltaPct,
    voice_commands_semana: shell.nsm.voiceWeek,
    horas_ahorradas_mes: shell.nsm.horasMes,
    citas_verificadas_pct: 100,
  };

  // Compute urgent cases: those with proxima_fecha within 7 days
  const now = Date.now();
  const ms7d = 7 * 24 * 3600 * 1000;
  const urgentes = matters
    .filter((m) => m.proxima_fecha && new Date(m.proxima_fecha).getTime() - now < ms7d)
    .sort((a, b) => new Date(a.proxima_fecha!).getTime() - new Date(b.proxima_fecha!).getTime())
    .slice(0, 2);

  const audienciaCount = matters.filter(
    (m) => m.proxima_tipo?.toLowerCase().includes('audiencia') &&
      m.proxima_fecha && new Date(m.proxima_fecha).getTime() - now < ms7d,
  ).length;
  const vencimientosCount = matters.filter(
    (m) => m.proxima_tipo?.toLowerCase().includes('vencimiento') &&
      m.proxima_fecha && new Date(m.proxima_fecha).getTime() - now < ms7d,
  ).length;

  const userFullName = firm?.user_full_name ?? '';
  const userName = userFullName.replace('Lic. ', '').split(' ').slice(-1)[0] ?? 'Lic.';
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Buenos días' : today.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb={`${today.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })} · ${today.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}
          title={
            <>
              {greeting}, <span className="text-accent">Lic. {userName}</span>
            </>
          }
          subtitle={
            <>
              Tienes {audienciaCount} audiencia{audienciaCount !== 1 ? 's' : ''} esta semana, {vencimientosCount} vencimiento{vencimientosCount !== 1 ? 's' : ''} próximos.
            </>
          }
          actions={<InicioTopActions />}
        />

        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          {urgentes[0] && <Greeting matterTitulo={urgentes[0].titulo} matterId={urgentes[0].id} />}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {urgentes[0] && <UrgentCard kind="audiencia" m={urgentes[0]} />}
            {urgentes[1] && <UrgentCard kind="vencimiento" m={urgentes[1]} />}
            <UrgentCard kind="dof" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
            <section className="surface p-[var(--pad-card)]">
              <SectionHead title="Acciones rápidas" right="5 plantillas core" />
              <div className="mt-[14px] grid grid-cols-2 gap-2">
                <QuickActionButton
                  href="/liquidacion"
                  icon={Ic.scales}
                  title="Demanda ordinaria laboral"
                  sub="despido sin justa causa / liquidación CST"
                />
                <QuickActionButton
                  href="/casos?materia=tutela"
                  icon={Ic.doc}
                  title="Tutela"
                  sub="Art. 86 CP · estabilidad reforzada"
                />
                <QuickActionButton
                  href="/casos?materia=civil"
                  icon={Ic.send}
                  title="Carta de cobro"
                  sub="cartera / desocupación"
                />
                <QuickActionButton
                  href="/casos?materia=administrativo"
                  icon={Ic.shield}
                  title="Acción de nulidad"
                  sub="contra acto administrativo"
                />
              </div>
            </section>

            <section className="surface p-[var(--pad-card)]">
              <SectionHead title="Tu mes en LexAI" rightDelta={nsm.delta_pct} />
              <div className="mt-[14px] grid grid-cols-2 gap-[14px]">
                <Stat
                  label="Documentos verificados"
                  big={String(nsm.documentos_verificados_mes)}
                  sub={`Meta ${nsm.documentos_meta_mes} · ${nsm.documentos_verificados_mes >= nsm.documentos_meta_mes ? 'supera por' : 'faltan'} ${Math.abs(nsm.documentos_verificados_mes - nsm.documentos_meta_mes)}`}
                  tone={nsm.documentos_verificados_mes >= nsm.documentos_meta_mes ? 'ok' : undefined}
                />
                <Stat
                  label="Voice / semana"
                  big={String(nsm.voice_commands_semana)}
                  sub="cmds · vs 75 meta"
                />
                <Stat
                  label="Horas ahorradas"
                  big={`${nsm.horas_ahorradas_mes}h`}
                  sub="vs paralegal junior"
                />
                <Stat
                  label="Citas verificadas"
                  big={`${nsm.citas_verificadas_pct}%`}
                  sub="0 alucinadas"
                  tone="ok"
                />
              </div>
            </section>
          </div>

          <section className="mt-6">
            <SectionHead title="Casos activos" rightLink={`Ver los ${matters.length} casos`} rightLinkHref="/casos" />
            <CasesTable rows={matters.slice(0, 5).map(matterToTableRow)} />
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function matterToTableRow(m: import('@/lib/api/rsc-fetchers').Matter) {
  const materia = (m.materia.charAt(0).toUpperCase() + m.materia.slice(1)) as
    | 'Laboral' | 'Civil' | 'Comercial' | 'Tutela' | 'Familiar' | 'Administrativo';
  const materiaLabel = materia === 'Constitucional' as never ? 'Tutela' : materia;
  const fechaFmt = m.proxima_fecha
    ? new Date(m.proxima_fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Sin fecha';
  return {
    id: m.id,
    display_id: m.display_id,
    cliente: '',
    titulo: m.titulo,
    materia: (materiaLabel === 'Comercial' ? 'Comercial' : materiaLabel) as never,
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

function Greeting({ matterTitulo, matterId }: { matterTitulo: string; matterId: string }) {
  return (
    <section id="lexai-greeting" className="surface mb-6 flex items-start gap-5 p-6">
      <div className="flex-1">
        <div className="text-[11.5px] font-semibold uppercase tracking-wider muted">
          LexAI te dijo al iniciar sesión
        </div>
        <p className="serif mt-2 max-w-[680px] text-[21px] font-normal leading-[1.4] -tracking-[0.01em]">
          &ldquo;Hola Lic. Tienes un caso urgente: <em className="italic">{matterTitulo}</em>.
          ¿Preparamos los alegatos?&rdquo;
        </p>
        <GreetingActions matterId={matterId} />
      </div>
      <div className="flex-none text-right">
        <span className="chip chip-green">
          <span className="dot" />
          Voice listo · 840ms
        </span>
        <div className="mt-[6px] text-[11px] muted">OpenAI Realtime · gpt-realtime</div>
      </div>
    </section>
  );
}

function SectionHead({
  title,
  right,
  rightDelta,
  rightLink,
  rightLinkHref,
}: {
  title: string;
  right?: string;
  rightDelta?: number;
  rightLink?: string;
  rightLinkHref?: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="serif m-0 text-[16px] font-semibold -tracking-[0.01em]">{title}</h3>
      {right && <span className="text-[12px] muted">{right}</span>}
      {typeof rightDelta === 'number' && (
        <span className={cn('chip', rightDelta >= 0 ? 'chip-green' : 'chip-red')}>
          <span className="dot" />
          {rightDelta >= 0 ? '+' : ''}{rightDelta}%
        </span>
      )}
      {rightLink && rightLinkHref && (
        <Link href={rightLinkHref} className="inline-flex cursor-pointer items-center gap-1 text-[12.5px] text-accent">
          {rightLink} {Ic.arrow}
        </Link>
      )}
    </div>
  );
}

function UrgentCard({
  kind,
  m,
}: {
  kind: 'audiencia' | 'vencimiento' | 'dof';
  m?: import('@/lib/api/rsc-fetchers').Matter;
}) {
  if (kind === 'dof') {
    return (
      <article className="surface p-[var(--pad-card)]">
        <div className="flex items-center gap-2">
          <span className="chip chip-purple">DOF · hoy</span>
          <span className="ml-auto text-[11.5px] muted">3 nuevas</span>
        </div>
        <h4 className="serif m-[10px_0_4px] text-[18px] leading-[1.25] -tracking-[0.01em]">
          Reforma laboral 2026 · trámite Congreso
        </h4>
        <p className="m-0 text-[12.5px] leading-relaxed muted">
          Proyecto de ley unifica reglas de tercerización y modifica el Art. 64 CST.
        </p>
        <DofCardActions />
      </article>
    );
  }
  if (!m) return null;
  const dias = m.proxima_fecha
    ? Math.round((new Date(m.proxima_fecha).getTime() - Date.now()) / (24 * 3600 * 1000))
    : null;
  const tone = kind === 'audiencia' ? 'border-t-2 border-t-danger' : 'border-t-2 border-t-warn';
  return (
    <article className={cn('surface block p-[var(--pad-card)] transition hover:shadow-2', tone)}>
      <Link href={`/casos/${m.id}`} className="block">
        <div className="flex items-center gap-2">
          <span className={cn('chip', kind === 'audiencia' ? 'chip-red' : 'chip-amber')}>
            <span className="dot" />
            {dias !== null ? `en ${dias} días` : 'pendiente'}
          </span>
          <span className="ml-auto text-[11.5px] muted">
            {m.proxima_fecha ? new Date(m.proxima_fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
          </span>
        </div>
        <h4 className="serif m-[10px_0_4px] text-[18px] leading-[1.25] -tracking-[0.01em]">{m.titulo}</h4>
        <p className="m-0 text-[12.5px] leading-relaxed muted">
          {m.proxima_tipo} · {m.tribunal} · Exp. {m.expediente}
        </p>
      </Link>
      <div className="mt-[14px] flex gap-1.5">
        <UrgentCardActions matterId={m.id} kind={kind} />
        {m.cuantia !== null && (
          <span className="btn btn-sm">{formatCOP(m.cuantia)}</span>
        )}
      </div>
    </article>
  );
}

function Stat({
  label,
  big,
  sub,
  tone,
}: {
  label: string;
  big: string;
  sub: string;
  tone?: 'ok';
}) {
  return (
    <div>
      <div className="text-[11px] font-medium muted">{label}</div>
      <div
        className={cn(
          'serif tabular mt-[2px] text-[28px] font-semibold -tracking-[0.02em]',
          tone === 'ok' ? 'text-ok' : 'text-ink',
        )}
      >
        {big}
      </div>
      <div className="mt-[2px] text-[11.5px] muted">{sub}</div>
    </div>
  );
}
