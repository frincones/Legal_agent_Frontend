import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { Ic } from '@/components/atoms/icons';
import { createClient } from '@/lib/supabase/server';
import { formatCOP, formatRelative } from '@/lib/utils';
import { LiquidacionForm } from '@/components/liquidacion/LiquidacionForm';

export const revalidate = 30;

type LiquidacionRow = {
  id: string;
  trabajador_nombre: string | null;
  fecha_ingreso: string;
  fecha_terminacion: string;
  causa: string;
  total_amount: number;
  total_currency: string;
  formulas_version: string;
  computed_at: string;
};

export default async function LiquidacionPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('liquidacion_calculations')
    .select('id, trabajador_nombre, fecha_ingreso, fecha_terminacion, causa, total_amount, total_currency, formulas_version, computed_at')
    .order('computed_at', { ascending: false })
    .limit(20);
  const rows = (data ?? []) as LiquidacionRow[];

  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Calculadoras"
          title="Liquidación laboral"
          subtitle="Cálculo determinista CST + Ley 50/1990 + Ley 789/2002 · cero alucinación numérica"
          actions={
            <button className="btn">
              {Ic.mic} Dictar &ldquo;Liquidación de María, 7 años, salario 4.5 millones, despido injustificado&rdquo;
            </button>
          }
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="flex flex-col gap-5">
            <LiquidacionForm />

            <section className="surface p-[var(--pad-card)]">
              <h3 className="serif m-0 text-[16px] font-semibold">Cálculos guardados</h3>
              <div className="mt-3 flex flex-col">
                {rows.length === 0 ? (
                  <div className="muted text-[12.5px]">Sin cálculos guardados.</div>
                ) : (
                  rows.map((r) => (
                    <div key={r.id} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
                      <span className="grid h-[28px] w-[28px] flex-none place-items-center rounded-md bg-bg-sunken text-ink-2">
                        {Ic.scales}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold">
                          {r.trabajador_nombre ?? 'Sin nombre'}
                        </div>
                        <div className="text-[11.5px] muted">
                          {causaLabel(r.causa)} · {r.fecha_ingreso} → {r.fecha_terminacion}
                        </div>
                        <div className="mt-1 serif tabular text-[15px] font-semibold text-ok">
                          {formatCOP(Number(r.total_amount))}
                        </div>
                      </div>
                      <div className="text-right text-[10.5px] muted">
                        {formatRelative(r.computed_at)}
                        <div className="mt-0.5 mono">{r.formulas_version}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function causaLabel(c: string): string {
  return {
    injustificado: 'Despido sin justa causa',
    justa_causa: 'Despido con justa causa',
    renuncia: 'Renuncia voluntaria',
    mutuo_acuerdo: 'Mutuo acuerdo',
    terminacion_contrato: 'Terminación de contrato',
    fin_obra: 'Fin de obra/labor',
  }[c] ?? c;
}
