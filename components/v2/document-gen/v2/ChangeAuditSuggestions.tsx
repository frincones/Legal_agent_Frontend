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
import type { AuditFinding, AuditResult, AuditSeverity, AuditIntent } from "@/lib/hooks/useChangeAuditor";

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
          {/* M19.18.E — banner de intent + acciones globales */}
          {audit.intent && audit.intent !== "unknown" && audit.intent_detail && (
            <IntentBanner audit={audit} documentId={documentId} onDone={onDismiss} />
          )}
          {audit.findings.map((f, idx) => (
            <FindingRow
              key={`${audit.id}_${idx}`}
              finding={f}
              documentId={documentId}
              userInstructionBase={audit.user_instruction || "aplicar sugerencia del auditor"}
            />
          ))}
          {/* M19.18.E — acciones de pie de card */}
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
            <button
              type="button"
              onClick={onDismiss}
              className="text-[10.5px] text-zinc-500 hover:text-zinc-700 underline"
            >
              Ignorar todas las sugerencias
            </button>
            <span className="text-zinc-300 text-[10px]">·</span>
            <span className="text-[10px] text-zinc-400 italic">
              o escribe tu propio cambio en el chat
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const INTENT_LABEL: Record<AuditIntent, string> = {
  rename: "renombrar",
  redate: "cambiar fecha",
  remoney: "cambiar monto",
  retext: "redactar",
  delete: "eliminar",
  add: "agregar",
  unknown: "",
};

function IntentBanner({
  audit,
  documentId,
  onDone,
}: {
  audit: AuditResult;
  documentId: string | null;
  onDone: () => void;
}) {
  const [propagating, setPropagating] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const intentLabel = INTENT_LABEL[audit.intent || "unknown"] || "";

  const propagate = React.useCallback(async () => {
    if (!documentId) return;
    setPropagating(true);
    setErr(null);
    try {
      // El auditor detectó la intención (ej. "rename de X a Y").
      // Le pedimos al chat que ejecute propagate_change con esos datos.
      const instr = audit.intent_detail
        ? `Detecté: ${audit.intent_detail}. Aplica esta intención a TODO el documento usando "propagate_change". Solo emite esa acción.`
        : `Propaga el cambio del bloque [${audit.edited_block_id}] a todo el documento.`;
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
        setDone(true);
        window.dispatchEvent(
          new CustomEvent("lexai:doc-changed", {
            detail: {
              documentId,
              edited_block_id: audit.edited_block_id,
              user_instruction: instr,
              source: "auditor-propagate",
            },
          })
        );
        setTimeout(onDone, 800);
      } else {
        setErr(data?.reply || "No hubo cambios al propagar.");
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setPropagating(false);
    }
  }, [documentId, audit, onDone]);

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded px-2.5 py-2 text-[11.5px] text-indigo-900 flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <span aria-hidden>🎯</span>
        <div className="flex-1">
          <div className="font-medium">Intención detectada: {intentLabel}</div>
          <div className="text-[11px] opacity-90 mt-0.5">{audit.intent_detail}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={propagate}
          disabled={propagating || done}
          className={`text-[10.5px] px-2 py-0.5 rounded border ${
            done
              ? "bg-emerald-100 border-emerald-300 text-emerald-700"
              : "bg-white border-indigo-300 hover:bg-indigo-50 text-indigo-700"
          } disabled:opacity-50`}
        >
          {done ? "✓ propagado" : propagating ? "propagando…" : "✨ Propagar a todo el documento"}
        </button>
        {err && <span className="text-[10px] text-red-600">{err}</span>}
      </div>
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
  const [ignored, setIgnored] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [draft, setDraft] = React.useState(finding.suggested_change);
  const [err, setErr] = React.useState<string | null>(null);
  const style = SEVERITY_STYLE[finding.severity] || SEVERITY_STYLE.info;
  const dimLabel = DIMENSION_LABEL[finding.dimension] || finding.dimension;

  const runInstruction = React.useCallback(
    async (instr: string, src: string) => {
      if (!documentId) return;
      setApplying(true);
      setErr(null);
      try {
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
                source: src,
              },
            })
          );
        } else {
          setErr(data?.reply || "Sin cambios aplicados. Prueba con otra opción o escribe el cambio en el chat.");
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setApplying(false);
      }
    },
    [documentId, finding]
  );

  const apply = React.useCallback(() => {
    const instr = `Aplica esta sugerencia del auditor al bloque [${finding.block_id}] (${dimLabel}): ${finding.suggested_change}`;
    return runInstruction(instr, "auditor-apply");
  }, [finding, dimLabel, runInstruction]);

  const applyEdited = React.useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setErr("Escribe el cambio que quieres aplicar.");
      return;
    }
    const instr = `Aplica este cambio al bloque [${finding.block_id}] (${dimLabel}): ${trimmed}`;
    return runInstruction(instr, "auditor-apply-edited");
  }, [draft, finding, dimLabel, runInstruction]);

  const askAlternative = React.useCallback(() => {
    const instr = `Esta sugerencia del auditor no me convence: "${finding.suggested_change}". Dame UNA alternativa diferente para resolver el mismo problema en el bloque [${finding.block_id}] (${dimLabel}: ${finding.issue}). Solo aplica la nueva alternativa, no la original.`;
    return runInstruction(instr, "auditor-alt");
  }, [finding, dimLabel, runInstruction]);

  if (ignored) {
    return (
      <div className="text-[10.5px] text-zinc-400 italic px-2.5 py-1">
        ✕ Sugerencia ignorada ({dimLabel})
        <button
          type="button"
          className="ml-2 underline hover:text-zinc-700"
          onClick={() => setIgnored(false)}
        >
          deshacer
        </button>
      </div>
    );
  }

  return (
    <div className={`border ${style.border} ${style.bg} rounded px-2.5 py-1.5 text-[11.5px] ${style.text}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span aria-hidden>{style.icon}</span>
        <span className="font-medium">{dimLabel}</span>
        <span className="text-[10px] opacity-60">· bloque {finding.block_id.slice(0, 14)}</span>
      </div>
      <div className="mb-1.5">{finding.issue}</div>

      {!editMode && finding.suggested_change && (
        <div className="text-[11px] italic opacity-90 mb-1.5">
          Sugerencia: {finding.suggested_change}
        </div>
      )}

      {editMode && (
        <div className="mb-1.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            disabled={applying}
            className="w-full text-[11px] border border-zinc-300 rounded px-2 py-1 outline-none focus:border-blue-400 bg-white text-zinc-900"
            placeholder="Edita la sugerencia antes de aplicar…"
          />
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {!editMode && (
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
            {applied ? "✓ aplicado" : applying ? "aplicando…" : "✨ Aplicar"}
          </button>
        )}
        {editMode && (
          <button
            type="button"
            onClick={applyEdited}
            disabled={applying || applied || !draft.trim()}
            className="text-[10.5px] px-2 py-0.5 rounded border bg-white border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
          >
            {applying ? "aplicando…" : "✓ Aplicar editado"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setEditMode((m) => !m);
            setErr(null);
          }}
          disabled={applying || applied}
          className="text-[10.5px] px-2 py-0.5 rounded border bg-white border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
          title="Modifica la sugerencia antes de aplicar"
        >
          {editMode ? "← cancelar" : "✏ Editar"}
        </button>
        <button
          type="button"
          onClick={askAlternative}
          disabled={applying || applied}
          className="text-[10.5px] px-2 py-0.5 rounded border bg-white border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
          title="Pide al agente una alternativa diferente"
        >
          🔄 Otra opción
        </button>
        <button
          type="button"
          onClick={() => setIgnored(true)}
          disabled={applying || applied}
          className="text-[10.5px] px-2 py-0.5 rounded text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          ignorar
        </button>
        {err && <span className="text-[10px] text-red-600 w-full">{err}</span>}
      </div>
    </div>
  );
}
