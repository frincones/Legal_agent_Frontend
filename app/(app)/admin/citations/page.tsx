/**
 * Sprint M15 · Admin Dashboard - Citation Verification Health
 *
 * KPIs:
 * - CER (Citation Existence Rate) últimos 7d
 * - Verificaciones por estado/source
 * - Últimas fallas (no_encontrada/sospechosa/error)
 * - Shadow diffs (cuando SHADOW_MODE=1)
 */
"use client";

import * as React from "react";

interface HealthMetric {
  result_state: string;
  source: string;
  total: number;
  avg_confidence: number;
  avg_duration_ms: number;
  p50_ms: number;
  p95_ms: number;
  verificadas: number;
  no_encontradas: number;
  last_attempt_at: string | null;
}

interface RecentFailure {
  citation_ref: string;
  ref_type: string;
  result_state: string;
  source: string;
  confidence_score: number;
  normalized_ref: string | null;
  duration_ms: number | null;
  sources_tried: any;
  created_at: string;
}

interface ShadowDiff {
  citation_ref: string;
  citation_type: string;
  legacy_state: string;
  legacy_method: string;
  agent_state: string;
  agent_method: string;
  agent_confidence: number;
  is_critical: boolean;
  diff_type: string;
  created_at: string;
}

export default function AdminCitationsPage() {
  const [health, setHealth] = React.useState<HealthMetric[]>([]);
  const [failures, setFailures] = React.useState<RecentFailure[]>([]);
  const [shadowDiffs, setShadowDiffs] = React.useState<ShadowDiff[]>([]);
  const [shadowSummary, setShadowSummary] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/admin/citations/health").then((r) => r.ok ? r.json() : { metrics: [] }),
      fetch("/api/admin/citations/recent-failures?limit=20").then((r) => r.ok ? r.json() : { failures: [] }),
      fetch("/api/admin/citations/shadow-diffs?limit=30").then((r) => r.ok ? r.json() : { summary: [], diffs: [] }),
    ])
      .then(([h, f, s]) => {
        setHealth(h.metrics || []);
        setFailures(f.failures || []);
        setShadowSummary(s.summary || []);
        setShadowDiffs(s.diffs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // KPIs
  const totalVerif = health.reduce((acc, h) => acc + h.total, 0);
  const totalReales = health.filter((h) => h.result_state !== "no_encontrada").reduce((acc, h) => acc + h.total, 0);
  const verificadas = health.filter((h) => h.result_state === "verificada").reduce((acc, h) => acc + h.total, 0);
  const noEncontradas = health.filter((h) => h.result_state === "no_encontrada").reduce((acc, h) => acc + h.total, 0);
  const cer = totalVerif > 0 ? Math.round((verificadas / totalVerif) * 100) : 0;
  const avgP95 = health.length > 0 ? Math.round(health.reduce((acc, h) => acc + h.p95_ms, 0) / health.length) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📊 Verification Health Dashboard</h1>

      {loading && <p className="text-zinc-500">Cargando…</p>}

      {/* KPI Cards */}
      {!loading && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard label="Citation Existence Rate" value={`${cer}%`}
            variant={cer >= 95 ? "good" : cer >= 80 ? "warning" : "danger"} />
          <KpiCard label="Verificaciones (7d)" value={String(totalVerif)} />
          <KpiCard label="No encontradas" value={String(noEncontradas)}
            variant={noEncontradas === 0 ? "good" : noEncontradas < 5 ? "warning" : "danger"} />
          <KpiCard label="Latencia p95 (avg)" value={`${avgP95}ms`}
            variant={avgP95 < 2000 ? "good" : avgP95 < 4000 ? "warning" : "danger"} />
        </div>
      )}

      {/* Shadow Summary (si SHADOW_MODE activo) */}
      {shadowSummary.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">🔍 Shadow Mode — divergencias 7d</h2>
          <div className="grid grid-cols-4 gap-2">
            {shadowSummary.map((s) => (
              <div key={s.diff_type} className={`border rounded p-3 ${
                s.diff_type === "critical" ? "border-red-300 bg-red-50" :
                s.diff_type === "medium" ? "border-amber-300 bg-amber-50" :
                "border-zinc-300 bg-zinc-50"
              }`}>
                <div className="text-xs font-medium uppercase">{s.diff_type}</div>
                <div className="text-2xl font-bold">{s.total}</div>
                <div className="text-[10px] text-zinc-500">{s.unique_citations} citas únicas</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Table */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Métricas por estado/source (7d)</h2>
        <table className="w-full text-sm border border-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Source</th>
              <th className="text-right p-2">Total</th>
              <th className="text-right p-2">Avg Confidence</th>
              <th className="text-right p-2">p50 / p95 (ms)</th>
            </tr>
          </thead>
          <tbody>
            {health.map((h, i) => (
              <tr key={i} className="border-t border-zinc-100">
                <td className="p-2">{h.result_state}</td>
                <td className="p-2 font-mono text-xs">{h.source}</td>
                <td className="p-2 text-right">{h.total}</td>
                <td className="p-2 text-right">{(h.avg_confidence * 100).toFixed(0)}%</td>
                <td className="p-2 text-right text-zinc-500">{h.p50_ms.toFixed(0)} / {h.p95_ms.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Failures */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">⚠️ Últimas fallas (20)</h2>
        <table className="w-full text-sm border border-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="text-left p-2">Cita</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Method</th>
              <th className="text-right p-2">Confidence</th>
              <th className="text-right p-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {failures.map((f, i) => (
              <tr key={i} className="border-t border-zinc-100">
                <td className="p-2 font-mono text-xs">{f.citation_ref}</td>
                <td className="p-2">{f.ref_type}</td>
                <td className="p-2">
                  <span className={
                    f.result_state === "no_encontrada" ? "text-red-700" :
                    f.result_state === "sospechosa" ? "text-amber-700" :
                    "text-zinc-700"
                  }>{f.result_state}</span>
                </td>
                <td className="p-2 text-xs">{f.source}</td>
                <td className="p-2 text-right">{(f.confidence_score * 100).toFixed(0)}%</td>
                <td className="p-2 text-right text-[10px] text-zinc-500">
                  {new Date(f.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shadow Diffs */}
      {shadowDiffs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">🔬 Shadow diffs (legacy vs agent)</h2>
          <table className="w-full text-sm border border-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left p-2">Cita</th>
                <th className="text-left p-2">Legacy</th>
                <th className="text-left p-2">Agent</th>
                <th className="text-left p-2">Tipo diff</th>
              </tr>
            </thead>
            <tbody>
              {shadowDiffs.map((d, i) => (
                <tr key={i} className={`border-t border-zinc-100 ${d.is_critical ? "bg-red-50" : ""}`}>
                  <td className="p-2 font-mono text-xs">{d.citation_ref}</td>
                  <td className="p-2 text-xs">{d.legacy_state} <span className="text-zinc-400">({d.legacy_method})</span></td>
                  <td className="p-2 text-xs">{d.agent_state} <span className="text-zinc-400">({d.agent_method}, {(d.agent_confidence * 100).toFixed(0)}%)</span></td>
                  <td className="p-2 text-xs font-medium">{d.diff_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, variant = "default" }: { label: string; value: string; variant?: "default" | "good" | "warning" | "danger" }) {
  const cls =
    variant === "good" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
    variant === "warning" ? "bg-amber-50 border-amber-200 text-amber-900" :
    variant === "danger" ? "bg-red-50 border-red-200 text-red-900" :
    "bg-zinc-50 border-zinc-200 text-zinc-900";
  return (
    <div className={`border rounded p-3 ${cls}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
