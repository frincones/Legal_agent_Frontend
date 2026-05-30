/**
 * Sprint M20.07 · Admin Dashboard - Cost Analytics
 *
 * Visualiza métricas comparativas legacy vs lean:
 *   - Costo total y promedio por arm
 *   - Latencia p50/p95/p99
 *   - Pass rate, QA avg
 *   - Tokens cache hit (prompt caching Anthropic)
 *   - Breakdown por tool (top 15)
 *   - Breakdown por doc_type
 */
"use client";

import * as React from "react";

type ArmSummary = {
  arm: string;
  n: number;
  latency_p50_s: number;
  latency_p95_s: number;
  latency_p99_s: number;
  cost_avg_usd: number;
  cost_total_usd: number;
  qa_avg: number;
  cache_tokens_total: number;
  passed: number;
  pass_rate: number;
  distinct_firms: number;
};

type SummaryResponse = {
  window_hours: number;
  captured_at: string;
  by_arm: ArmSummary[];
};

type ToolRow = {
  tool_name: string;
  n: number;
  avg_ms: number;
  p95_ms: number;
  ok: number;
  fail: number;
  cached: number;
  tokens_total: number;
  cost_total_usd: number;
  fail_rate: number;
  cache_hit_rate: number;
};

type TemplateRow = {
  template_id: string;
  arm: string;
  n: number;
  lat_avg_s: number;
  cost_avg_usd: number;
  qa_avg: number;
};

export default function CostAnalyticsPage() {
  const [summary, setSummary] = React.useState<SummaryResponse | null>(null);
  const [tools, setTools] = React.useState<ToolRow[]>([]);
  const [templates, setTemplates] = React.useState<TemplateRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hours, setHours] = React.useState(24);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, t, tp] = await Promise.all([
          fetch(`/api/admin/cost-analytics/summary?hours=${hours}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/admin/cost-analytics/by-tool?hours=${hours}`).then(r => r.ok ? r.json() : { rows: [] }),
          fetch(`/api/admin/cost-analytics/by-template?hours=${hours}`).then(r => r.ok ? r.json() : { rows: [] }),
        ]);
        setSummary(s);
        setTools((t?.rows || []).slice(0, 15));
        setTemplates(tp?.rows || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [hours]);

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Cost Analytics (M20.07)</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Comparativa lean (ReAct) vs legacy (17 stages) · tools usage · prompt caching.
        </p>
        <div className="mt-3 flex gap-2">
          {[24, 72, 168, 720].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`px-3 py-1 rounded-md text-sm border ${
                hours === h
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              {h < 24 ? `${h}h` : `${Math.round(h / 24)}d`}
            </button>
          ))}
        </div>
      </header>

      {loading && <p className="text-slate-500">Cargando métricas...</p>}

      {summary && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">
            Resumen por arm · ventana {summary.window_hours}h
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.by_arm.map((a) => (
              <article
                key={a.arm}
                className={`rounded-lg border p-4 ${
                  a.arm === "lean"
                    ? "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20"
                    : "border-slate-200 bg-slate-50/30 dark:bg-slate-950/20"
                }`}
              >
                <h3 className="text-base font-semibold capitalize">
                  {a.arm} <span className="text-sm text-slate-500">({a.n} runs)</span>
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <dt className="text-slate-600 dark:text-slate-400">Latencia p50</dt>
                  <dd className="font-mono">{a.latency_p50_s.toFixed(1)}s</dd>
                  <dt className="text-slate-600 dark:text-slate-400">Latencia p95</dt>
                  <dd className="font-mono">{a.latency_p95_s.toFixed(1)}s</dd>
                  <dt className="text-slate-600 dark:text-slate-400">Latencia p99</dt>
                  <dd className="font-mono">{a.latency_p99_s.toFixed(1)}s</dd>
                  <dt className="text-slate-600 dark:text-slate-400">Cost avg</dt>
                  <dd className="font-mono">${a.cost_avg_usd.toFixed(4)}</dd>
                  <dt className="text-slate-600 dark:text-slate-400">Cost total</dt>
                  <dd className="font-mono">${a.cost_total_usd.toFixed(2)}</dd>
                  <dt className="text-slate-600 dark:text-slate-400">QA avg</dt>
                  <dd className="font-mono">{a.qa_avg.toFixed(2)}</dd>
                  <dt className="text-slate-600 dark:text-slate-400">Pass rate</dt>
                  <dd className="font-mono">{(a.pass_rate * 100).toFixed(0)}%</dd>
                  <dt className="text-slate-600 dark:text-slate-400">Cache tokens</dt>
                  <dd className="font-mono">{(a.cache_tokens_total / 1000).toFixed(1)}K</dd>
                  <dt className="text-slate-600 dark:text-slate-400">Firms únicas</dt>
                  <dd className="font-mono">{a.distinct_firms}</dd>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {tools.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Top tools (lean)</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr className="text-left">
                  <th className="px-3 py-2">Tool</th>
                  <th className="px-3 py-2 text-right">N</th>
                  <th className="px-3 py-2 text-right">Avg ms</th>
                  <th className="px-3 py-2 text-right">P95 ms</th>
                  <th className="px-3 py-2 text-right">OK</th>
                  <th className="px-3 py-2 text-right">Fail</th>
                  <th className="px-3 py-2 text-right">Cached</th>
                  <th className="px-3 py-2 text-right">Tokens</th>
                  <th className="px-3 py-2 text-right">Cost USD</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((t) => (
                  <tr key={t.tool_name} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2 font-mono">{t.tool_name}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.n}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.avg_ms.toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.p95_ms.toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-emerald-600">{t.ok}</td>
                    <td className="px-3 py-2 text-right font-mono text-red-600">{t.fail}</td>
                    <td className="px-3 py-2 text-right font-mono text-blue-600">{t.cached}</td>
                    <td className="px-3 py-2 text-right font-mono">{(t.tokens_total / 1000).toFixed(1)}K</td>
                    <td className="px-3 py-2 text-right font-mono">${t.cost_total_usd.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {templates.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Por template (doc_type)</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr className="text-left">
                  <th className="px-3 py-2">Template</th>
                  <th className="px-3 py-2">Arm</th>
                  <th className="px-3 py-2 text-right">N</th>
                  <th className="px-3 py-2 text-right">Lat avg</th>
                  <th className="px-3 py-2 text-right">Cost avg</th>
                  <th className="px-3 py-2 text-right">QA avg</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => (
                  <tr key={`${t.template_id}-${t.arm}-${i}`} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-3 py-2 font-mono">{t.template_id}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        t.arm === "lean"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}>
                        {t.arm}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{t.n}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.lat_avg_s.toFixed(1)}s</td>
                    <td className="px-3 py-2 text-right font-mono">${t.cost_avg_usd.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right font-mono">{t.qa_avg.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
