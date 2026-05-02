import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { createClient } from '@/lib/supabase/server';
import { LiquidacionForm } from '@/components/liquidacion/LiquidacionForm';
import { LiquidacionDictarButton } from '@/components/liquidacion/LiquidacionDictarButton';
import { HistorialList, type LiquidacionRow } from '@/components/liquidacion/HistorialList';

export const revalidate = 30;

export default async function LiquidacionPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('liquidacion_calculations')
    .select('id, trabajador_nombre, fecha_ingreso, fecha_terminacion, causa, total_amount, total_currency, formulas_version, computed_at')
    .order('computed_at', { ascending: false })
    .limit(50);
  const rows = (data ?? []) as LiquidacionRow[];

  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Calculadoras"
          title="Liquidación laboral"
          subtitle="Cálculo determinista CST + Ley 50/1990 + Ley 789/2002 · cero alucinación numérica"
          actions={<LiquidacionDictarButton />}
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="flex flex-col gap-5">
            <LiquidacionForm />

            <section className="surface p-[var(--pad-card)]">
              <div className="flex items-center justify-between">
                <h3 className="serif m-0 text-[16px] font-semibold">Cálculos guardados</h3>
                <span className="text-[11.5px] muted">{rows.length}</span>
              </div>
              <div className="mt-3">
                <HistorialList rows={rows} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
