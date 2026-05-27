"use client";

/**
 * M19.17.C — Panel de sugerencias del agente auditor.
 *
 * Se renderiza dentro del chat panel izquierdo del IntegratedGenerationCanvas.
 * Cada audit run genera un card colapsable con:
 *   - Score de coherencia (badge color-coded)
 *   - Summary
 *   - Lista de findings (con severity icon, dimensión, issue, sugerencia)
 *   - Botón "Aplicar" por finding → reusa el chat endpoint con instrucción
 *
 * Toggle global para apagar el auditor (localStorage).
 */

import * as React from "react";
import type { AuditFinding, AuditResult, AuditSeverity } from "@/lib/hooks/useChangeAuditor";

interface Props {
  audits: AuditResult[];
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  documentId: string | null;
}

const DIMENSION_LABEL: Record<string, string> = {
  coherencia_interna: "Coherencia interna",
  dependencias: "Dependencias jurídicas",
  riesgos: "Riesgos legales",
  vacios: "Vacíos normativos",
  pretensiones: "Pretensiones derivadas",
  liquidacion: "Liquidación",
  procesales: "Procesales",
  buenas_practicas: "Buenas prácticas",
};

const SEVERITY_STYLE: Record<AuditSeverity, { icon: string; bg: string; text: string; border: string }> = {
  critical: {
    icon: "⛔",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
  },
  warning: {
    icon: "⚠",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  info: {
    icon: "ℹ",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
};

function scoreColor(score: number): string {
  if (score >= 0.85) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 0.6) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

export function ChangeAuditSuggestions({
  audits,
  enabled,
  onToggle,
  onDismiss,
  onClearAll,
  documentId,
}: Props) {
  // Solo mostrar audits no descartados, ordenados del más reciente al más viejo
  const visible = audits.filter((a) => !a.dismissed).slice().reverse();

  if (!enabled && visible.length === 0) {
    return (
      <div className="mx-3 my-2 text-[11px] text-zinc-400 italic">
        ⓘ Auditor desactivado.{" "}
        <button
          type="button"
          className="underline hover:text-zinc-600"
          onClick={() => onToggle(true)}
        >
          Activar
        </button>
      </div>
    );
  }

  if (visible.length === 0) return null;

  return (
    <div className="mx-3 my-2 flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span className="font-medium">Auditor LexAI · {visible.length} análisis</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(!enabled)}
            className="hover:text-zinc-700"
            title={enabled ? "Apagar auditor" : "Activar auditor"}
          >
            {enabled ? "🔔 activo" : "🔕 apagado"}
          </button>
          {visible.length > 1 && (
            <button
              type="button"
              onClick={onClearAll}
              className="hover:text-zinc-700"
            >
              limpiar
            </button>
          )}
        </div>
      </div>

      {visible.map((audit) => (
        <AuditCard
          key={audit.id}
          audit={audit}
          documentId={documentId}
          onDismiss={() => onDismiss(audit.id)}
        />
      ))}
    </div>
  );
}

function AuditCard({
  audit,
  documentId,
  onDismiss,
}: {
  audit: AuditResult;
  documentId: string | null;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = React.useState(true);

  if (audit.loading) {
    return (
      <div className="border border-zinc-200 rounded-md px-3 py-2 bg-white text-[12px] flex items-center gap-2 animate-pulse">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-400" aria-hidden />
        <span className="text-zinc-500">Auditando cambio en bloque {audit.edited_block_id.slice(0, 12)}…</span>
      </div>
    );
  }
  if (audit.error) {
    return (
      <div className="border border-zinc-200 rounded-md px-3 py-2 bg-white text-[12px] text-zinc-500 flex items-center justify-between">
        <span>⚠ Auditor no disponible: {audit.error}</span>
        <button type="button" className="text-zinc-400 hover:text-zinc-700" onClick={onDismiss}>×</button>
      </div>
    );
  }

  const hasFindings = audit.findings.length > 0;
  const score = audit.coherence_score;

  return (
    <div className="border border-zinc-200 rounded-md bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-50 text-[12px]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${scoreColor(score)}`}>
            {(score * 100).toFixed(0)}%
          </span>
          <span className="text-zinc-700 font-medium">
            {hasFindings ? `${audit.findings.length} hallazgo${audit.findings.length > 1 ? "s" : ""}` : "Sin observaciones"}
          </span>
          {audit.summary && (
            <span className="text-zinc-500 italic truncate">· {audit.summary}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-zinc-400 text-[10px]">{expanded ? "▾" : "▸"}</span>
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-zinc-300 hover:text-zinc-700 px-1"
            title="Descartar"
          >
            ×
          </span>
        </div>
      </button>

      {expanded && hasFindings && (
        <div className="border-t border-zinc-100 px-3 py-2 flex flex-col gap-2">
          {audit.findings.map((f, idx) => (
            <FindingRow
              key={`${audit.id}_${idx}`}
              finding={f}
              documentId={documentId}
              userInstructionBase={audit.user_instruction || "aplicar sugerencia del auditor"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FindingRow({
  finding,
  documentId,
  userInstructionBase,
}: {
  finding: AuditFinding;
  documentId: string | null;
  userInstructionBase: string;
}) {
  const [applying, setApplying] = React.useState(false);
  const [applied, setApplied] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const style = SEVERITY_STYLE[finding.severity] || SEVERITY_STYLE.info;
  const dimLabel = DIMENSION_LABEL[finding.dimension] || finding.dimension;

  const apply = React.useCallback(async () => {
    if (!documentId) return;
    setApplying(true);
    setErr(null);
    try {
      // Llamar al chat endpoint con la sugerencia como instrucción.
      // El LLM interpretará y aplicará el cambio sobre el block_id afectado.
      const instr = `Aplica esta sugerencia del auditor al bloque [${finding.block_id}] (${dimLabel}): ${finding.suggested_change}`;
      const res = await fetch(
        `/api/documents/v2/documents/${encodeURIComponent(documentId)}/chat`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: instr }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if ((data?.blocks_changed ?? 0) > 0) {
        setApplied(true);
        window.dispatchEvent(
          new CustomEvent("lexai:doc-changed", {
            detail: {
              documentId,
              edited_block_id: finding.block_id,
              user_instruction: instr,
              source: "auditor-apply",
            },
          })
        );
      } else {
        setErr(data?.reply || "Sin cambios aplicados");
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setApplying(false);
    }
  }, [documentId, finding, dimLabel]);

  return (
    <div className={`border ${style.border} ${style.bg} rounded px-2.5 py-1.5 text-[11.5px] ${style.text}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span aria-hidden>{style.icon}</span>
        <span className="font-medium">{dimLabel}</span>
        <span className="text-[10px] opacity-60">· bloque {finding.block_id.slice(0, 14)}</span>
      </div>
      <div className="mb-1.5">{finding.issue}</div>
      {finding.suggested_change && (
        <div className="text-[11px] italic opacity-90 mb-1.5">
          Sugerencia: {finding.suggested_change}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={apply}
          disabled={applying || applied}
          className={`text-[10.5px] px-2 py-0.5 rounded border transition ${
            applied
              ? "bg-emerald-100 border-emerald-300 text-emerald-700"
              : "bg-white border-zinc-300 hover:bg-zinc-50"
          } disabled:opacity-50`}
        >
          {applied ? "✓ aplicado" : applying ? "aplicando…" : "✨ Aplicar sugerencia"}
        </button>
        {err && <span className="text-[10px] text-red-600">{err}</span>}
      </div>
    </div>
  );
}
