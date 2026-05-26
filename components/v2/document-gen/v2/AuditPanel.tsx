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
  estado?: "verificada" | "superada" | "sospechosa" | "no_encontrada";
  method?: string;
  fuente_url?: string | null;
  titulo?: string | null;
  // Sprint M17: hyperlink garantizado + derogadas con dos URLs
  fuente_url_original?: string | null;
  fuente_url_vigente?: string | null;
  url_http_status?: number | null;
  url_validated?: boolean | null;
  is_derogada?: boolean;
  // Sprint M18: provenance + Judge
  discovered_by?: string | null;       // 'brave_search' | 'internal_db' | 'pattern' | ...
  snippet?: string | null;              // evidencia textual mostrada al usuario
  judge_action?: string | null;         // 'accept' | 'refine' | 'reject'
  judge_rationale?: string | null;      // explicación del Judge LLM
  judge_retried?: boolean;
  query_used?: string | null;
}

interface AuditDerogation {
  norma: string;
  vigente: boolean;
  derogada_por?: string | null;
  // M17.b: link a fuente oficial + (si derogada) link a vigente
  fuente_url?: string | null;
  fuente_url_vigente?: string | null;
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
        <details open>
          <summary className="cursor-pointer text-zinc-700 hover:text-zinc-900 select-none">
            {audit.citation_verifications.length} verificaciones de citas
          </summary>
          <ul className="mt-1 max-h-60 overflow-auto space-y-1 pl-2">
            {audit.citation_verifications.map((c, i) => {
              const estado = c.estado || (c.verified ? "verificada" : "no_encontrada");
              const icon =
                estado === "verificada" ? "✅" :
                estado === "superada" ? "⚠️" :
                estado === "sospechosa" ? "⚠️" :
                "❌";
              const tone =
                estado === "verificada" ? "text-emerald-700" :
                estado === "superada" ? "text-amber-700" :
                estado === "sospechosa" ? "text-amber-600" :
                "text-red-700";
              const label =
                estado === "verificada" ? "verificada" :
                estado === "superada" ? "derogada" :
                estado === "sospechosa" ? "no confirmada (fuente caída)" :
                "no encontrada";
              const isDerogada = estado === "superada" && !!c.fuente_url_vigente;
              const primaryUrl = c.fuente_url_original || c.fuente_url;
              // M18: tooltip con provenance + snippet + judge rationale
              const provenance = buildProvenanceTooltip(c);
              return (
                <li key={i} className="flex items-center gap-2 flex-wrap">
                  <span aria-hidden>{icon}</span>
                  <code className={`text-[10px] truncate flex-1 min-w-0 ${tone}`}>{c.ref}</code>
                  <span className="text-zinc-400 text-[10px]">{c.type}</span>
                  <span className="text-zinc-400 text-[10px] italic" title={c.method || ""}>{label}</span>
                  {primaryUrl && (
                    <SourceLink
                      url={primaryUrl}
                      variant={isDerogada ? "original" : estado === "verificada" ? "primary" : estado === "sospechosa" ? "warning" : "danger"}
                      label={isDerogada ? "original (derog.)" : "fuente"}
                      validated={c.url_validated ?? undefined}
                      httpStatus={c.url_http_status ?? undefined}
                      provenance={provenance}
                    />
                  )}
                  {isDerogada && c.fuente_url_vigente && (
                    <SourceLink
                      url={c.fuente_url_vigente}
                      variant="replacement"
                      label="vigente"
                      validated={c.url_validated ?? undefined}
                      provenance={provenance}
                    />
                  )}
                </li>
              );
            })}
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
              <li key={i} className="flex items-center gap-2 flex-wrap">
                <span aria-hidden>{d.vigente ? "✅" : "⚠️"}</span>
                <code className="text-[10px] truncate flex-1 min-w-0">{d.norma}</code>
                {d.derogada_por && (
                  <span className="text-amber-700 text-[10px]">derog. por {d.derogada_por}</span>
                )}
                {d.fuente_url && (
                  <SourceLink
                    url={d.fuente_url}
                    variant={d.vigente ? "primary" : "original"}
                    label={d.vigente ? "fuente" : "original (derog.)"}
                  />
                )}
                {!d.vigente && d.fuente_url_vigente && (
                  <SourceLink
                    url={d.fuente_url_vigente}
                    variant="replacement"
                    label="vigente"
                  />
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

type SourceLinkVariant = "primary" | "original" | "replacement" | "warning" | "danger";

function SourceLink({
  url,
  variant,
  label,
  validated,
  httpStatus,
  provenance,
}: {
  url: string;
  variant: SourceLinkVariant;
  label: string;
  validated?: boolean;
  httpStatus?: number;
  provenance?: string;
}) {
  // Token visual por variante — coherente con sistema (emerald/amber/blue/red/zinc)
  const styles: Record<SourceLinkVariant, string> = {
    primary: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
    original: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
    replacement: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    warning: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
    danger: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
  };
  const cls = styles[variant];
  // Tooltip detallado: URL + estado HEAD validation + M18 provenance
  const tooltipParts = [url];
  if (validated === false) tooltipParts.push("⚠ URL no responde (HEAD)");
  else if (validated === true) tooltipParts.push("✓ URL verificada (HTTP 200)");
  if (httpStatus) tooltipParts.push(`HTTP ${httpStatus}`);
  if (provenance) tooltipParts.push(provenance);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={tooltipParts.join("\n")}
      className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 border rounded transition-colors ${cls}`}
    >
      <span>↗</span>
      <span>{label}</span>
      {validated === false && <span aria-hidden className="text-[8px] opacity-70">!</span>}
    </a>
  );
}

/** M18: helper para construir tooltip de provenance + snippet + judge rationale */
function buildProvenanceTooltip(c: AuditCitation): string | undefined {
  const lines: string[] = [];
  if (c.discovered_by) {
    const discoveryLabels: Record<string, string> = {
      brave_search: "🔎 Descubierta vía Brave Search (gov.co)",
      internal_db: "💾 Cache BD interna",
      pattern: "📐 URL canónica por patrón",
      live_fetch: "🌐 Live fetch de fuente oficial",
      manual: "✍ Seed manual validado",
      llm_fallback: "🤖 LLM fallback",
      verification_agent: "✓ Validada por agente",
      smart_search: "🔎 SmartSearchTool",
    };
    lines.push(discoveryLabels[c.discovered_by] || `Origen: ${c.discovered_by}`);
  }
  if (c.snippet) {
    const snipped = c.snippet.length > 180 ? c.snippet.slice(0, 180) + "…" : c.snippet;
    lines.push(`📄 ${snipped}`);
  }
  if (c.judge_rationale) {
    lines.push(`⚖ Judge: ${c.judge_rationale}`);
  }
  if (c.judge_retried) {
    lines.push("(re-buscado por Judge)");
  }
  return lines.length > 0 ? lines.join("\n\n") : undefined;
}
