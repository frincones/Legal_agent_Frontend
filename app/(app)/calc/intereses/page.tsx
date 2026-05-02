import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { createClient } from '@/lib/supabase/server';
import { InteresesForm } from '@/components/calc/InteresesForm';
import { InteresesHistorial, type InteresesRow } from '@/components/calc/InteresesHistorial';

export const revalidate = 30;

export default async function InteresesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('calc_intereses')
    .select('id, case_label, tipo_interes, capital_cop, fecha_inicio, fecha_fin, tasa_anual_aplicada, base_calculo, metodo, monto_total_cop, formulas_version, computed_at')
    .order('computed_at', { ascending: false })
    .limit(50);
  const rows = (data ?? []) as InteresesRow[];

  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Calculadoras"
          title="Intereses moratorios"
          subtitle="Decreto 519/2007 + CC Art. 1617 · 1.5× corriente · cero alucinación numérica"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="flex flex-col gap-5">
            <InteresesForm />

            <section className="surface p-[var(--pad-card)]">
              <div className="flex items-center justify-between">
                <h3 className="serif m-0 text-[16px] font-semibold">Cálculos guardados</h3>
                <span className="text-[11.5px] muted">{rows.length}</span>
              </div>
              <div className="mt-3">
                <InteresesHistorial rows={rows} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
