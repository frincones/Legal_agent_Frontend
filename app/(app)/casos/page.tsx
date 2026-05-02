import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { CasesTable } from '@/components/cases/CasesTable';
import { CasosTopActions } from '@/components/casos/CasosActions';
import { fetchMatters, type Matter } from '@/lib/api/rsc-fetchers';
import { cn } from '@/lib/utils';

export const revalidate = 30;

const TABS: Array<{ key: string; label: string; filter?: (m: Matter) => boolean }> = [
  { key: 'todos', label: 'Todos' },
  { key: 'laborales', label: 'Laborales', filter: (m) => m.materia === 'laboral' },
  { key: 'civiles', label: 'Civiles', filter: (m) => m.materia === 'civil' },
  { key: 'comerciales', label: 'Comerciales', filter: (m) => m.materia === 'comercial' || m.materia === 'mercantil' },
  { key: 'tutelas', label: 'Tutelas', filter: (m) => m.materia === 'constitucional' },
  { key: 'borradores', label: 'Borradores', filter: (m) => m.status === 'borrador' },
];

export default async function CasosPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const matters = await fetchMatters({ limit: 100 });
  const activeTab = searchParams.tab ?? 'todos';
  const tabsWithCount = TABS.map((t) => ({
    ...t,
    count: t.filter ? matters.filter(t.filter).length : matters.length,
  }));
  const filtered = TABS.find((t) => t.key === activeTab)?.filter
    ? matters.filter(TABS.find((t) => t.key === activeTab)!.filter!)
    : matters;

  const audiencias = matters.filter((m) =>
    m.proxima_tipo?.toLowerCase().includes('audiencia') &&
    m.proxima_fecha &&
    new Date(m.proxima_fecha).getTime() - Date.now() < 7 * 24 * 3600 * 1000,
  ).length;
  const vencimientos = matters.filter((m) =>
    m.proxima_tipo?.toLowerCase().includes('vencimiento') &&
    m.proxima_fecha &&
    new Date(m.proxima_fecha).getTime() - Date.now() < 7 * 24 * 3600 * 1000,
  ).length;

  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Casos"
          title="Todos los casos"
          subtitle={
            <>
              {matters.length} activos · {vencimientos} vencen esta semana · {audiencias} audiencia{audiencias !== 1 ? 's' : ''} próxima{audiencias !== 1 ? 's' : ''}
            </>
          }
          actions={<CasosTopActions />}
        />

        <div id="casos-tabs" className="flex items-center gap-2 overflow-x-auto border-b border-line px-[var(--pad-screen)] pt-3">
          {tabsWithCount.map((t) => (
            <a
              key={t.key}
              href={`/casos?tab=${t.key}`}
              className={cn(
                'mb-[-1px] border-b-2 border-transparent bg-transparent px-3 py-[10px] text-[13px] font-medium text-ink-3 hover:text-ink',
                activeTab === t.key && 'border-accent text-ink',
              )}
            >
              {t.label} ({t.count})
            </a>
          ))}
          <span className="ml-auto text-[12px] muted">Ordenar:</span>
          <button className="btn btn-sm">Próxima fecha {Ic.arrow}</button>
        </div>

        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          {filtered.length === 0 ? (
            <div className="surface p-12 text-center muted">
              No hay casos en esta categoría todavía.
            </div>
          ) : (
            <CasesTable rows={filtered.map(matterToTableRow)} />
          )}
        </div>
      </main>
    </AppShell>
  );
}

function matterToTableRow(m: Matter) {
  const materiaLabel = m.materia.charAt(0).toUpperCase() + m.materia.slice(1);
  const fechaFmt = m.proxima_fecha
    ? new Date(m.proxima_fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Sin fecha';
  return {
    id: m.id,
    display_id: m.display_id,
    cliente: '',
    titulo: m.titulo,
    materia: materiaLabel,
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
