import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { createClient } from '@/lib/supabase/server';
import { PrescripcionForm } from '@/components/calc/PrescripcionForm';
import { PrescripcionHistorial, type PrescripcionRow } from '@/components/calc/PrescripcionHistorial';

export const revalidate = 30;

export default async function PrescripcionPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('calc_prescripciones')
    .select('id, case_label, tipo_accion, fecha_exigibilidad, fecha_interrupcion, fecha_prescripcion, dias_restantes, prescrita, formulas_version, computed_at')
    .order('computed_at', { ascending: false })
    .limit(50);
  const rows = (data ?? []) as PrescripcionRow[];

  return (
    <AppShell active="casos">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Calculadoras"
          title="Cálculo de prescripción"
          subtitle="CC + C.Co. + CST + CGP + CPP · cero alucinación · interrupción CGP Art. 94"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="flex flex-col gap-5">
            <PrescripcionForm />

            <section className="surface p-[var(--pad-card)]">
              <div className="flex items-center justify-between">
                <h3 className="serif m-0 text-[16px] font-semibold">Cálculos guardados</h3>
                <span className="text-[11.5px] muted">{rows.length}</span>
              </div>
              <div className="mt-3">
                <PrescripcionHistorial rows={rows} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
