"use client";

/**
 * M19.23.H — Missing Data Prompt.
 *
 * Card UI que se muestra en el chat panel cuando el backend
 * `data_completeness_gate` (M19.23.C) detecta datos críticos faltantes.
 *
 * Comportamiento:
 *  - Modo borrador: card informativa (collapse, no bloquea)
 *  - Modo firma: card prominente con form inline para completar campos
 *
 * Inspirado en el patrón "Context Gathering" del skill doc-coauthoring
 * de Anthropic, donde el agente pregunta los datos antes de redactar.
 *
 * Cuando el usuario completa los datos, hace un POST al /chat endpoint
 * con un mensaje natural: "los datos faltantes son: X=Y, Z=W. Actualiza
 * el documento con esto." Esto reusa el flujo de M19.18.B (propagate_change)
 * para aplicar los datos a todos los placeholders.
 */

import * as React from "react";
import type { MissingDataReport, MissingField } from "@/lib/types/blocks";

interface Props {
  report: MissingDataReport;
  documentId: string | null;
  onDismiss: () => void;
}

export function MissingDataPrompt({ report, documentId, onDismiss }: Props) {
  const [expanded, setExpanded] = React.useState(report.borrador_mode === false);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const allFields: MissingField[] = [
    ...report.missing_critical,
    ...report.missing_optional,
  ];

  // Si no hay nada faltante, no mostrar nada
  if (allFields.length === 0) return null;

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async () => {
    if (!documentId) {
      setSubmitError("Espera a que termine la generación inicial.");
      return;
    }
    const filled = Object.entries(values).filter(([, v]) => v.trim().length > 0);
    if (filled.length === 0) {
      setSubmitError("Escribe al menos un dato.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Construir mensaje natural para el chat (reusa propagate_change M19.18.B)
      const lines = filled.map(([key, val]) => {
        const field = allFields.find((f) => f.field_key === key);
        const label = field?.label || key;
        return `  • ${label}: ${val}`;
      });
      const message =
        `Estos son los datos faltantes que el agente necesitaba. ` +
        `Actualízalos en todo el documento (reemplaza los placeholders correspondientes):\n` +
        lines.join("\n");

      const res = await fetch(
        `/api/documents/v2/documents/${encodeURIComponent(documentId)}/chat`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if ((data?.blocks_changed ?? 0) > 0) {
        setSubmitted(true);
        // Disparar refresh del canvas + dejar que el auditor revise
        window.dispatchEvent(
          new CustomEvent("lexai:doc-changed", {
            detail: {
              documentId,
              source: "missing-data-prompt",
              user_instruction: message,
            },
          })
        );
        // Auto-dismiss tras 2s
        setTimeout(onDismiss, 1500);
      } else {
        setSubmitError(
          data?.reply ||
            "No se aplicaron cambios. Intenta describir los datos en el chat libre."
        );
      }
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const headerBg = report.borrador_mode
    ? "bg-amber-50 border-amber-200 text-amber-900"
    : "bg-red-50 border-red-300 text-red-900";

  return (
    <div className={`mx-3 my-2 border-2 rounded-md overflow-hidden ${headerBg}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 transition"
      >
        <div className="flex items-center gap-2 text-[12px]">
          <span aria-hidden>{report.borrador_mode ? "ⓘ" : "⚠"}</span>
          <span className="font-medium">
            {report.borrador_mode
              ? `Datos opcionales: ${allFields.length} campos detectados`
              : `Faltan ${report.missing_critical.length} datos críticos`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] opacity-70">
            {expanded ? "▾" : "▸"}
          </span>
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-current opacity-40 hover:opacity-80 px-1"
            title="Descartar"
          >
            ×
          </span>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-current/20 px-3 py-2.5 bg-white space-y-2.5">
          <div className="text-[11.5px] text-zinc-700">
            {report.borrador_mode ? (
              <span>
                El agente generó el documento con <strong>placeholders</strong>{" "}
                para estos campos. Puedes completarlos abajo o editarlos
                directamente en el canvas.
              </span>
            ) : (
              <span>
                <strong>Modo firma activo</strong>: el documento legal requiere
                estos datos para ser válido. Complétalos antes de firmar.
              </span>
            )}
          </div>

          {/* Críticos */}
          {report.missing_critical.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase text-red-700">
                Críticos ({report.missing_critical.length})
              </div>
              {report.missing_critical.map((f) => (
                <FieldRow
                  key={f.field_key}
                  field={f}
                  value={values[f.field_key] || ""}
                  onChange={(v) => handleChange(f.field_key, v)}
                  disabled={submitting || submitted}
                />
              ))}
            </div>
          )}

          {/* Opcionales */}
          {report.missing_optional.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase text-zinc-500">
                Opcionales ({report.missing_optional.length})
              </div>
              {report.missing_optional.map((f) => (
                <FieldRow
                  key={f.field_key}
                  field={f}
                  value={values[f.field_key] || ""}
                  onChange={(v) => handleChange(f.field_key, v)}
                  disabled={submitting || submitted}
                />
              ))}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || submitted}
              className={`text-[11px] px-2.5 py-1 rounded border transition ${
                submitted
                  ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                  : "bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800"
              } disabled:opacity-50`}
            >
              {submitted
                ? "✓ Aplicado al documento"
                : submitting
                  ? "Aplicando…"
                  : "✨ Aplicar al documento"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="text-[10.5px] text-zinc-500 hover:text-zinc-700 underline"
            >
              {report.borrador_mode ? "Mantener placeholders" : "Ignorar"}
            </button>
            {submitError && (
              <span className="text-[10px] text-red-600">{submitError}</span>
            )}
          </div>

          {/* Razonamiento del agente */}
          {report.reasoning && (
            <div className="text-[10px] italic text-zinc-500 pt-1 border-t border-zinc-100">
              Razonamiento: {report.reasoning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  disabled,
}: {
  field: MissingField;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[11px] font-medium text-zinc-800">
        {field.label}
        {field.severity === "critical" && (
          <span className="text-red-600 ml-1">*</span>
        )}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.example_value || field.suggested_placeholder || ""}
        className="text-[12px] px-2 py-1 border border-zinc-300 rounded outline-none focus:border-blue-400 disabled:opacity-50 disabled:bg-zinc-50"
      />
      <span className="text-[10px] text-zinc-500">{field.description}</span>
    </div>
  );
}
