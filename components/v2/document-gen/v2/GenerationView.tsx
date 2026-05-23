"use client";

import * as React from "react";
import { useGenerationStreamV2 } from "@/lib/hooks/useGenerationStreamV2";
import { ForensicCanvas } from "./ForensicCanvas";
import { GenerationTimeline } from "./GenerationTimeline";

const DOC_TYPES: Array<{ value: string; label: string; jur: string }> = [
  { value: "", label: "Auto-detectar", jur: "" },
  { value: "demanda_laboral_ordinaria", label: "Demanda Ordinaria Laboral", jur: "laboral" },
  { value: "demanda_civil_ordinaria", label: "Demanda Civil Ordinaria", jur: "civil" },
  { value: "demanda_ejecutivo_singular", label: "Demanda Ejecutiva Singular", jur: "civil" },
  { value: "demanda_alimentos", label: "Demanda de Alimentos", jur: "familia" },
  { value: "tutela", label: "Acción de Tutela", jur: "constitucional" },
  { value: "derecho_peticion", label: "Derecho de Petición", jur: "administrativo" },
  { value: "contrato_arrendamiento", label: "Contrato de Arrendamiento", jur: "civil" },
  { value: "contrato_prestacion_servicios", label: "Contrato Prestación Servicios", jur: "comercial" },
  { value: "denuncia_penal", label: "Denuncia Penal", jur: "penal" },
  { value: "recurso_apelacion", label: "Recurso de Apelación", jur: "general" },
  { value: "concepto_juridico", label: "Concepto Jurídico", jur: "general" },
  { value: "poder_especial", label: "Poder Especial", jur: "general" },
];

export function GenerationView() {
  const { state, generate, reset, abort } = useGenerationStreamV2();
  const [intent, setIntent] = React.useState("");
  const [brief, setBrief] = React.useState("");
  const [docType, setDocType] = React.useState("");

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
        <div className="border-b border-zinc-200 bg-white p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-5xl mx-auto">
            <div>
              <label className="text-xs font-medium text-zinc-700">Tipo de documento</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full mt-1 text-sm border border-zinc-300 rounded px-2 py-1.5"
              >
                {DOC_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
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
          <ForensicCanvas blocks={state.blocks} status={state.status} />
        </div>
      )}
    </div>
  );
}
