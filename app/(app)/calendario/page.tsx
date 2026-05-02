import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

export const revalidate = 30;

type DeadlineRow = {
  id: string;
  matter_id: string;
  titulo: string;
  fecha: string;
  tipo: string | null;
  completado: boolean;
};

type MatterRow = { id: string; titulo: string; expediente: string | null; materia: string };

export default async function CalendarioPage() {
  const supabase = createClient();
  const [dlRes, mRes] = await Promise.all([
    supabase
      .from('matter_deadlines')
      .select('id, matter_id, titulo, fecha, tipo, completado')
      .eq('completado', false)
      .order('fecha')
      .limit(50),
    supabase.from('matters').select('id, titulo, expediente, materia'),
  ]);
  const deadlines = (dlRes.data ?? []) as DeadlineRow[];
  const mattersById = Object.fromEntries(((mRes.data ?? []) as MatterRow[]).map((m) => [m.id, m]));

  const grouped = groupByDay(deadlines);

  return (
    <AppShell active="calendario">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Calendario"
          title="Agenda procesal"
          subtitle={`${deadlines.length} plazos pendientes`}
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          {grouped.length === 0 ? (
            <div className="surface p-12 text-center muted">No hay plazos pendientes.</div>
          ) : (
            <div className="flex flex-col gap-6">
              {grouped.map(([dayLabel, items]) => (
                <section key={dayLabel}>
                  <h3 className="serif mb-2 text-[14px] font-semibold uppercase tracking-wider muted">
                    {dayLabel}
                  </h3>
                  <div className="surface overflow-hidden">
                    {items.map((d) => {
                      const m = mattersById[d.matter_id];
                      const dt = new Date(d.fecha);
                      const dias = Math.round((dt.getTime() - Date.now()) / (24 * 3600 * 1000));
                      const tone = dias <= 5 ? 'border-l-danger' : dias <= 14 ? 'border-l-warn' : 'border-l-line';
                      return (
                        <Link
                          key={d.id}
                          href={`/casos/${d.matter_id}`}
                          className={cn(
                            'flex items-center gap-3 border-b border-line border-l-[3px] p-3 last:border-b-0 hover:bg-bg-sunken',
                            tone,
                          )}
                        >
                          <div className="w-[64px] text-center">
                            <div className="serif text-[16px] font-semibold tabular">
                              {dt.toLocaleDateString('es-CO', { day: 'numeric' })}
                            </div>
                            <div className="text-[10.5px] muted">
                              {dt.toLocaleDateString('es-CO', { month: 'short' })}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13.5px] font-semibold">{d.titulo}</div>
                            {m && (
                              <div className="text-[11.5px] muted">
                                {m.titulo} · Exp. {m.expediente ?? '—'}
                              </div>
                            )}
                          </div>
                          <span className={`chip ${dias <= 5 ? 'chip-red' : dias <= 14 ? 'chip-amber' : ''}`}>
                            <span className="dot" />
                            {dias >= 0 ? `en ${dias}d` : `vencido ${-dias}d`}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function groupByDay(rows: DeadlineRow[]): Array<[string, DeadlineRow[]]> {
  const map = new Map<string, DeadlineRow[]>();
  for (const r of rows) {
    const dt = new Date(r.fecha);
    const dias = Math.round((dt.getTime() - Date.now()) / (24 * 3600 * 1000));
    let label: string;
    if (dias <= 0) label = 'Hoy / atrasados';
    else if (dias <= 7) label = 'Esta semana';
    else if (dias <= 30) label = 'Este mes';
    else label = 'Próximo mes y siguientes';
    map.set(label, [...(map.get(label) ?? []), r]);
  }
  return Array.from(map.entries());
}
