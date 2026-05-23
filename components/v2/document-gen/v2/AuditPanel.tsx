"use client";

import * as React from "react";

interface AuditSummary {
  citation_existence_rate: number | null;
  derogation_compliance_rate: number | null;
  total_citations: number;
  verified_citations: number;
  vigent_norms: number;
  total_norms_checked: number;
  total_blocks: number;
  duration_seconds: number;
  cost_usd: number;
}

interface AuditCitation {
  type: string;
  ref: string;
  verified?: boolean;
  derogada?: boolean;
  similarity?: number;
  chunk_id?: string | null;
}

interface AuditDerogation {
  norma: string;
  vigente: boolean;
  derogada_por?: string | null;
}

export interface AuditReport {
  generation_id: string;
  template_id: string;
  generated_at: string;
  summary: AuditSummary;
  citations: AuditCitation[];
  citation_verifications: AuditCitation[];
  derogation_checks: AuditDerogation[];
  warnings: string[];
}

interface Props {
  audit: AuditReport | null;
  onDownload?: () => void;
}

export function AuditPanel({ audit, onDownload }: Props) {
  if (!audit) {
    return (
      <div className="border border-zinc-200 rounded-md bg-white p-3 text-xs">
        <p className="text-zinc-500 text-center py-4">Esperando auditoría…</p>
      </div>
    );
  }

  const s = audit.summary;
  const citationPct = s.citation_existence_rate != null ? Math.round(s.citation_existence_rate * 100) : null;
  const derogPct = s.derogation_compliance_rate != null ? Math.round(s.derogation_compliance_rate * 100) : null;

  return (
    <div className="border border-zinc-200 rounded-md bg-white p-3 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">📋 Panel de Auditoría</h3>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(audit, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-${audit.generation_id}.json`;
            a.click();
            URL.revokeObjectURL(url);
            onDownload?.();
          }}
          className="text-[10px] px-2 py-0.5 border border-zinc-300 rounded hover:bg-zinc-50"
        >
          ↓ audit.json
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat
          label="Citation Existence Rate"
          value={citationPct != null ? `${citationPct}%` : "—"}
          variant={citationPct != null && citationPct >= 95 ? "good" : citationPct != null && citationPct >= 80 ? "warning" : "default"}
        />
        <Stat
          label="Vigencia Normativa"
          value={derogPct != null ? `${derogPct}%` : "—"}
          variant={derogPct != null && derogPct >= 95 ? "good" : derogPct != null && derogPct >= 80 ? "warning" : "default"}
        />
        <Stat label="Bloques generados" value={String(s.total_blocks)} />
        <Stat label="Duración" value={`${s.duration_seconds.toFixed(1)}s`} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Citas verificadas" value={`${s.verified_citations}/${s.total_citations}`} />
        <Stat label="Costo USD" value={`$${s.cost_usd.toFixed(4)}`} />
      </div>

      {audit.citation_verifications.length > 0 && (
        <details>
          <summary className="cursor-pointer text-zinc-700 hover:text-zinc-900 select-none">
            {audit.citation_verifications.length} verificaciones de citas
          </summary>
          <ul className="mt-1 max-h-40 overflow-auto space-y-1 pl-2">
            {audit.citation_verifications.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <span aria-hidden>{c.verified ? "✅" : "❌"}</span>
                <code className="text-[10px] truncate flex-1">{c.ref}</code>
                <span className="text-zinc-400 text-[10px]">{c.type}</span>
                {c.similarity != null && (
                  <span className="text-zinc-400 text-[10px]">sim {c.similarity.toFixed(2)}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {audit.derogation_checks.length > 0 && (
        <details>
          <summary className="cursor-pointer text-zinc-700 hover:text-zinc-900 select-none">
            {audit.derogation_checks.length} verificaciones de vigencia
          </summary>
          <ul className="mt-1 max-h-40 overflow-auto space-y-1 pl-2">
            {audit.derogation_checks.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <span aria-hidden>{d.vigente ? "✅" : "⚠️"}</span>
                <code className="text-[10px] truncate flex-1">{d.norma}</code>
                {d.derogada_por && (
                  <span className="text-amber-700 text-[10px]">derog. por {d.derogada_por}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {audit.warnings.length > 0 && (
        <div className="border-l-4 border-amber-300 pl-2 bg-amber-50/50 py-1">
          <div className="font-semibold text-amber-900 text-[10px]">⚠ {audit.warnings.length} advertencias</div>
          <ul className="text-amber-800 text-[10px]">
            {audit.warnings.map((w, i) => <li key={i}>· {w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, variant = "default" }: { label: string; value: string; variant?: "default" | "good" | "warning" }) {
  const bg =
    variant === "good" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
    variant === "warning" ? "bg-amber-50 border-amber-200 text-amber-900" :
    "bg-zinc-50 border-zinc-200 text-zinc-800";
  return (
    <div className={`border rounded px-2 py-1 ${bg}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  );
}
