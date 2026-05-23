"use client";

import * as React from "react";
import { useGenerationStreamV2 } from "@/lib/hooks/useGenerationStreamV2";
import { ForensicCanvas } from "./ForensicCanvas";
import { GenerationTimeline } from "./GenerationTimeline";
import { TemplateSelector, TemplateListItem } from "./TemplateSelector";
import { TemplatePreview, TemplatePreviewData } from "./TemplatePreview";
import { AuditPanel } from "./AuditPanel";
import { VersionHistory } from "./VersionHistory";

export function GenerationView() {
  const { state, generate, reset, abort } = useGenerationStreamV2();
  const [intent, setIntent] = React.useState("");
  const [brief, setBrief] = React.useState("");
  const [docType, setDocType] = React.useState("");
  const [templates, setTemplates] = React.useState<TemplateListItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<TemplatePreviewData | null>(null);

  // Load templates from backend on mount
  React.useEffect(() => {
    setTemplatesLoading(true);
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTemplates(Array.isArray(d) ? d : []))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, []);

  // Load preview when docType changes
  React.useEffect(() => {
    if (!docType) {
      setPreview(null);
      return;
    }
    fetch(`/api/templates/${encodeURIComponent(docType)}/preview`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPreview(d))
      .catch(() => setPreview(null));
  }, [docType]);

  const start = async () => {
    if (!intent.trim()) return;
    await generate({
      intent: intent.trim(),
      user_brief: brief.trim() || undefined,
      doc_type: docType || undefined,
    });
  };

  const isRunning = state.status === "running";
  const totalDuration = state.startedAt && state.finishedAt
    ? state.finishedAt - state.startedAt
    : (state.startedAt ? Date.now() - state.startedAt : undefined);

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-2 flex items-center gap-4">
        <h1 className="text-sm font-semibold">⚖️ LexAI · Canvas Generate v2</h1>
        <span className="text-xs text-zinc-500">
          {state.status === "idle" && "listo"}
          {state.status === "running" && <span className="text-emerald-600 animate-pulse">● generando…</span>}
          {state.status === "completed" && <span className="text-emerald-700">✓ completado</span>}
          {state.status === "error" && <span className="text-red-700">✗ error: {state.error}</span>}
        </span>
        <div className="ml-auto flex gap-2">
          {isRunning && (
            <button onClick={abort} className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50">
              Cancelar
            </button>
          )}
          {!isRunning && state.status !== "idle" && (
            <button onClick={reset} className="text-xs px-2 py-1 border border-zinc-300 rounded hover:bg-zinc-100">
              Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Input panel (visible solo en idle / error) */}
      {(state.status === "idle" || state.status === "error") && (
        <div className="border-b border-zinc-200 bg-white p-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-5xl mx-auto">
            <div>
              <TemplateSelector
                value={docType}
                items={templates}
                loading={templatesLoading}
                onChange={(id) => setDocType(id)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-zinc-700">Intent</label>
              <input
                type="text"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="Redacta una demanda laboral por despido sin justa causa…"
                className="w-full mt-1 text-sm border border-zinc-300 rounded px-2 py-1.5"
              />
            </div>
            {preview && (
              <div className="md:col-span-3">
                <TemplatePreview template={preview} />
              </div>
            )}
            <div className="md:col-span-3">
              <label className="text-xs font-medium text-zinc-700">Brief / datos del caso</label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Demandante: María Pérez. Salario $2.500.000. Fecha ingreso 15-mar-2019…"
                rows={3}
                className="w-full mt-1 text-sm border border-zinc-300 rounded px-2 py-1.5 font-mono"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                onClick={start}
                disabled={!intent.trim()}
                className="text-sm px-4 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-40"
              >
                ⚡ Generar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split timeline + canvas */}
      {state.status !== "idle" && (
        <div className="flex-1 grid grid-cols-[320px_1fr] overflow-hidden">
          <GenerationTimeline
            steps={state.timeline}
            totalDurationMs={totalDuration}
            collapsed={state.status === "completed"}
          />
          <div className="overflow-y-auto">
            <ForensicCanvas blocks={state.blocks} status={state.status} />
            {state.status === "completed" && state.audit && (
              <div className="mx-auto max-w-3xl my-4 px-4">
                <AuditPanel audit={state.audit} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
