import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 30;

type PMFMetrics = {
  w1_retention_pct: number;
  voice_touch_ratio_pct: number;
  docs_this_week: number;
  activated: number;
  users_total: number;
  runs_total: number;
  voice_sessions: number;
  matters_active: number;
  hitl_distribution: Record<string, number>;
};

export default async function PMFDashboard() {
  const supabase = createClient();
  const { data } = await supabase.rpc('lexai_pmf_metrics');
  const m = (data ?? {}) as PMFMetrics;

  const totalDecidedHitl = Object.values(m.hitl_distribution ?? {}).reduce((s, v) => s + v, 0);
  const approvedHitl = (m.hitl_distribution ?? {}).approved ?? 0;
  const approvalPct = totalDecidedHitl === 0 ? 0 : Math.round((approvedHitl / totalDecidedHitl) * 100);

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Admin"
          title="PMF Dashboard"
          subtitle="Métricas Product/Market Fit · Sean Ellis · target ≥ 40% 'muy decepcionado'"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-5">
            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Metric label="W1 Retention" value={`${m.w1_retention_pct ?? 0}%`} target="≥70%" tone={(m.w1_retention_pct ?? 0) >= 70 ? 'ok' : 'warn'} />
              <Metric label="Voice/touch ratio" value={`${m.voice_touch_ratio_pct ?? 0}%`} target="≥35%" tone={(m.voice_touch_ratio_pct ?? 0) >= 35 ? 'ok' : 'warn'} />
              <Metric label="Docs · 7 días" value={String(m.docs_this_week ?? 0)} target="≥40 / abogado" />
              <Metric label="HITL approval" value={`${approvalPct}%`} target="≥85%" tone={approvalPct >= 85 ? 'ok' : 'warn'} />
              <Metric label="Activación seat" value={`${m.activated ?? 0}/${m.users_total ?? 0}`} target="≥80%" />
              <Metric label="Total runs · 7d" value={String(m.runs_total ?? 0)} target="" />
              <Metric label="Voice sessions total" value={String(m.voice_sessions ?? 0)} target="" />
              <Metric label="Matters activos" value={String(m.matters_active ?? 0)} target="" />
            </section>

            <section className="surface p-[var(--pad-card)]">
              <h3 className="serif m-0 text-[16px] font-semibold">
                Sean Ellis Survey · &ldquo;¿Cómo te sentirías si no pudieras seguir usando LexAI?&rdquo;
              </h3>
              <p className="mt-2 text-[12.5px] muted">
                PMF se considera alcanzado cuando ≥40% de usuarios responden &ldquo;Muy
                decepcionado&rdquo;. La encuesta se dispara automáticamente al 2.º uso del producto.
                Resultados pendientes de instrumentar (Sprint 7).
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
                {['Muy decepcionado', 'Algo decepcionado', 'No decepcionado'].map((l) => (
                  <div key={l} className="rounded-md bg-bg-sunken p-3">
                    <div className="serif text-[24px] font-semibold">—</div>
                    <div className="muted">{l}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function Metric({
  label, value, target, tone,
}: {
  label: string; value: string; target: string; tone?: 'ok' | 'warn';
}) {
  return (
    <div className="surface p-[var(--pad-card)]">
      <div className="text-[11px] font-medium muted">{label}</div>
      <div className={`serif tabular mt-2 text-[28px] font-semibold -tracking-[0.02em] ${
        tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-ink'
      }`}>{value}</div>
      <div className="mt-1 text-[10.5px] muted">target: {target}</div>
    </div>
  );
}
