"use client";

/**
 * Sprint M8 + M19.23.K · Modal de captura de brief antes de redirigir
 * a /v2/canvas/draft?engine=v2.
 *
 * Comportamiento:
 *  1. Al abrirse, llama POST /api/documents/v2/preview-required-fields para
 *     que el AGENTE (gpt-4o) liste los campos críticos/opcionales necesarios
 *     para el doc_type detectado. Mientras carga, muestra spinner.
 *  2. Si el agente responde, renderiza los campos dinámicos con label,
 *     description, example. Distingue críticos (asterisco rojo) de opcionales.
 *  3. Si el preview falla o tarda, fallback a una sola textarea libre.
 *  4. Incluye toggle "Modo Borrador / Modo Firma" para que el usuario decida
 *     desde aquí (no después). Persiste preferencia en localStorage.
 *  5. Submit construye el brief como bullet list y redirige al canvas con
 *     borrador_mode en URL params.
 *
 * Diseño doc-type agnostic: NO hay listas hardcoded. El agente decide.
 */

import * as React from "react";

const LS_BORRADOR_KEY = "lexai-v2-borrador-mode";

interface DynamicField {
  field_key: string;
  label: string;
  description: string;
  example_value?: string | null;
  suggested_placeholder?: string | null;
}

interface PreviewResponse {
  doc_type: string;
  fields_critical: DynamicField[];
  fields_optional: DynamicField[];
  required_fields_count: number;
  reasoning: string;
  skipped: boolean;
  duration_ms: number;
}

export interface BriefModalProps {
  open: boolean;
  intent: string;
  templateId: string | null;
  onConfirm: (brief: string, opts: { borradorMode: boolean }) => void;
  onSkip: (opts: { borradorMode: boolean }) => void;
  onCancel: () => void;
}

export function BriefModal({
  open,
  intent,
  templateId,
  onConfirm,
  onSkip,
  onCancel,
}: BriefModalProps) {
  const [borradorMode, setBorradorMode] = React.useState<boolean>(true);
  const [preview, setPreview] = React.useState<PreviewResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [showAllOptional, setShowAllOptional] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(LS_BORRADOR_KEY);
      if (v === "false") setBorradorMode(false);
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_BORRADOR_KEY, String(borradorMode));
    } catch {}
  }, [borradorMode]);

  // Al abrir, dispara preview-required-fields
  React.useEffect(() => {
    if (!open || !intent) return;
    let cancelled = false;
    setPreview(null);
    setValues({});
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/documents/v2/preview-required-fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, doc_type: templateId || undefined }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PreviewResponse = await res.json();
        if (!cancelled) setPreview(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, intent, templateId]);

  if (!open) return null;

  const submit = () => {
    if (!preview) {
      onConfirm(intent, { borradorMode });
      return;
    }
    const allFields = [...preview.fields_critical, ...preview.fields_optional];
    const lines = allFields
      .filter((f) => values[f.field_key]?.trim())
      .map((f) => `- ${f.label}: ${values[f.field_key]?.trim()}`);
    const brief = lines.join("\n");
    onConfirm(brief, { borradorMode });
  };

  const handleSkip = () => onSkip({ borradorMode });

  const criticalFields = preview?.fields_critical || [];
  const optionalFields = preview?.fields_optional || [];
  const allFields = [...criticalFields, ...optionalFields];
  const filledCount = allFields.filter((f) => values[f.field_key]?.trim()).length;
  const filledCriticalCount = criticalFields.filter(
    (f) => values[f.field_key]?.trim()
  ).length;
  const missingCriticalCount = criticalFields.length - filledCriticalCount;

  const canSubmit =
    !loading &&
    (borradorMode || missingCriticalCount === 0 || criticalFields.length === 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          maxWidth: 720,
          width: "94%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 24,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Datos del caso</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {templateId || "documento legal"} · El agente analizó tu prompt y
              detectó qué datos necesita
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-700 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Modo Borrador / Firma */}
        <div className="mb-3 p-3 border border-zinc-200 rounded-lg bg-zinc-50">
          <div className="text-[11px] font-medium text-zinc-700 uppercase mb-2">
            Modo de generación
          </div>
          <div className="flex gap-2">
            <ModeOption
              active={borradorMode}
              onClick={() => setBorradorMode(true)}
              icon="✎"
              title="Borrador"
              description="El agente usa placeholders cuando faltan datos. Útil para revisar la estructura antes de tener todo el caso."
            />
            <ModeOption
              active={!borradorMode}
              onClick={() => setBorradorMode(false)}
              icon="✒"
              title="Firma"
              description="El agente alerta si faltan datos críticos. Útil cuando el documento debe quedar listo para firmar."
              accent="red"
            />
          </div>
        </div>

        <p className="text-xs italic text-zinc-600 mb-3 bg-zinc-50 p-2 rounded">
          {intent.length > 220 ? intent.slice(0, 220) + "…" : intent}
        </p>

        {loading && (
          <div className="py-8 flex flex-col items-center gap-2 text-zinc-500">
            <div className="animate-spin w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full" />
            <span className="text-xs">
              El agente está analizando qué datos necesita…
            </span>
            <span className="text-[10px] text-zinc-400">
              (5-15s · gpt-4o)
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="space-y-2">
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠ No se pudieron predecir los campos automáticamente ({error}).
              Puedes describir el caso libremente.
            </div>
            <textarea
              value={values._free || ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, _free: e.target.value }))
              }
              placeholder="Describe los datos del caso (partes, fechas, hechos clave, montos…)"
              rows={6}
              className="w-full text-sm border border-zinc-300 rounded px-2 py-1.5 outline-none focus:border-blue-400"
            />
          </div>
        )}

        {!loading && !error && preview && (
          <div className="space-y-3">
            {preview.reasoning && (
              <p className="text-[11px] text-zinc-600 italic">
                💡 {preview.reasoning}
              </p>
            )}

            {criticalFields.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase text-red-700">
                    Críticos ({criticalFields.length})
                  </div>
                  {!borradorMode && missingCriticalCount > 0 && (
                    <div className="text-[10px] text-red-600">
                      Faltan {missingCriticalCount} para firma
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {criticalFields.map((f) => (
                    <FieldRow
                      key={f.field_key}
                      field={f}
                      value={values[f.field_key] || ""}
                      onChange={(v) =>
                        setValues((vv) => ({ ...vv, [f.field_key]: v }))
                      }
                      critical
                    />
                  ))}
                </div>
              </div>
            )}

            {optionalFields.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowAllOptional((v) => !v)}
                  className="text-[10px] font-semibold uppercase text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                >
                  <span>{showAllOptional ? "▾" : "▸"}</span>
                  Opcionales ({optionalFields.length})
                </button>
                {showAllOptional && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {optionalFields.map((f) => (
                      <FieldRow
                        key={f.field_key}
                        field={f}
                        value={values[f.field_key] || ""}
                        onChange={(v) =>
                          setValues((vv) => ({ ...vv, [f.field_key]: v }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {criticalFields.length === 0 && optionalFields.length === 0 && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
                ✓ El agente considera que tu prompt ya tiene los datos
                necesarios. Puedes generar directamente.
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-zinc-200">
          <span className="text-xs text-zinc-500">
            {preview ? (
              <>
                {filledCount}/{allFields.length} campos llenados
                {borradorMode && filledCount === 0 && (
                  <span className="text-zinc-400">
                    {" "}· puedes saltar y usar placeholders
                  </span>
                )}
              </>
            ) : loading ? (
              "Analizando…"
            ) : (
              "Modo libre"
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-sm px-3 py-1.5 border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-40"
            >
              {borradorMode
                ? "Saltar (usar placeholders)"
                : "Saltar (modo firma alertará)"}
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className={`text-sm px-4 py-1.5 rounded text-white ${
                canSubmit
                  ? "bg-zinc-900 hover:bg-zinc-800"
                  : "bg-zinc-400 cursor-not-allowed"
              }`}
              title={
                !canSubmit && !borradorMode
                  ? `Completa los ${missingCriticalCount} datos críticos para modo firma`
                  : ""
              }
            >
              {borradorMode ? "⚡ Generar borrador" : "✒ Generar para firma"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeOption({
  active,
  onClick,
  icon,
  title,
  description,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  description: string;
  accent?: "red";
}) {
  const activeClass = active
    ? accent === "red"
      ? "border-red-400 bg-red-50"
      : "border-amber-400 bg-amber-50"
    : "border-zinc-200 bg-white hover:border-zinc-300";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-left p-2.5 rounded-md border-2 transition ${activeClass}`}
    >
      <div className="flex items-center gap-2 text-[12px] font-medium">
        <span>{icon}</span>
        <span>{title}</span>
        {active && <span className="text-[10px] opacity-60">✓ Activo</span>}
      </div>
      <div className="text-[10.5px] text-zinc-600 mt-1 leading-snug">
        {description}
      </div>
    </button>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  critical,
}: {
  field: DynamicField;
  value: string;
  onChange: (v: string) => void;
  critical?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[11px] font-medium text-zinc-800">
        {field.label}
        {critical && <span className="text-red-600 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.example_value || field.suggested_placeholder || ""}
        className="text-[12px] px-2 py-1 border border-zinc-300 rounded outline-none focus:border-blue-400"
      />
      {field.description && (
        <span className="text-[10px] text-zinc-500 leading-snug">
          {field.description}
        </span>
      )}
    </div>
  );
}
