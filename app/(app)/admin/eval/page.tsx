import { AppShell } from '@/components/shell/AppShell';
import { TopBar } from '@/components/shell/TopBar';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 30;

type AdminMetrics = {
  runs_total: number;
  avg_faithfulness: number | null;
  total_citations: number;
  verified_citations: number;
  hallucinated_blocked: number;
  e2e_p50_ms: number | null;
  e2e_p95_ms: number | null;
  voice_e2e_p50_ms: number | null;
  cit_distribution: Record<string, number>;
  hitl_distribution: Record<string, number>;
};

export default async function AdminEvalPage() {
  const supabase = createClient();
  const { data } = await supabase.rpc('lexai_admin_metrics');
  const m = (data ?? {}) as AdminMetrics;

  const verifPct =
    !m.total_citations || m.total_citations === 0
      ? 100
      : Math.round((m.verified_citations / m.total_citations) * 100);

  return (
    <AppShell active="inicio">
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <TopBar
          breadcrumb="Admin"
          title="Eval Dashboard"
          subtitle="Métricas de calidad LexAI · gold set CO + producción · LangSmith integración"
        />
        <div className="flex-1 overflow-auto p-[var(--pad-screen)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-5">
            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Metric label="Citation Existence" value={`${verifPct}%`} target="100%" tone={verifPct === 100 ? 'ok' : 'warn'} />
              <Metric label="Faithfulness avg" value={m.avg_faithfulness != null ? Number(m.avg_faithfulness).toFixed(2) : '—'} target="≥0.95" tone={(m.avg_faithfulness ?? 0) >= 0.95 ? 'ok' : 'warn'} />
              <Metric label="E2E text p95" value={m.e2e_p95_ms ? `${m.e2e_p95_ms}ms` : '—'} target="<6000ms" tone={(m.e2e_p95_ms ?? 0) < 6000 ? 'ok' : 'warn'} />
              <Metric label="Voice E2E p50" value={m.voice_e2e_p50_ms ? `${m.voice_e2e_p50_ms}ms` : '—'} target="<840ms" tone={(m.voice_e2e_p50_ms ?? 0) < 840 ? 'ok' : 'warn'} />
              <Metric label="Hallucinated blocked" value={String(m.hallucinated_blocked ?? 0)} target="cuanto más mejor" tone="ok" />
              <Metric label="Total runs (200)" value={String(m.runs_total ?? 0)} target="" />
              <Metric label="Citations recogidas" value={String(m.total_citations ?? 0)} target="" />
              <Metric label="Citations verificadas" value={String(m.verified_citations ?? 0)} target="" tone="ok" />
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="surface p-[var(--pad-card)]">
                <h3 className="serif m-0 text-[16px] font-semibold">Citation registry · estados</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {Object.entries(m.cit_distribution ?? {}).map(([estado, count]) => (
                    <li key={estado} className="flex items-center gap-3 text-[13px]">
                      <span
                        className={`chip ${
                          estado === 'verificada' ? 'chip-green' :
                          estado === 'superada' ? 'chip-red' : 'chip-amber'
                        }`}
                      >
                        {estado}
                      </span>
                      <span className="tabular muted">{count}</span>
                    </li>
                  ))}
                  {Object.keys(m.cit_distribution ?? {}).length === 0 && (
                    <li className="muted text-[12px]">Sin citas registradas.</li>
                  )}
                </ul>
              </div>

              <div className="surface p-[var(--pad-card)]">
                <h3 className="serif m-0 text-[16px] font-semibold">HITL · distribución decisiones</h3>
                <ul className="mt-3 flex flex-col gap-2">
                  {Object.entries(m.hitl_distribution ?? {}).map(([decision, count]) => (
                    <li key={decision} className="flex items-center gap-3 text-[13px]">
                      <span
                        className={`chip ${
                          decision === 'approved' ? 'chip-green' :
                          decision === 'rejected' ? 'chip-red' :
                          decision === 'edited' ? 'chip-blue' : 'chip-amber'
                        }`}
                      >
                        {decision}
                      </span>
                      <span className="tabular muted">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="surface p-[var(--pad-card)]">
              <h3 className="serif m-0 text-[16px] font-semibold">Gold set CO · eval harness</h3>
              <p className="mt-2 text-[12.5px] muted">
                Para activar el eval harness en CI, ejecuta{' '}
                <code className="mono">python eval/run_eval.py --gold eval/gold_set_co.json</code>{' '}
                en el backend Railway. Bloquea el CI si Recall@5 cae &gt;2 puntos vs baseline.
              </p>
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
