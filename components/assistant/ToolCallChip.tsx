"use client";

/**
 * Sprint M19.5 + M19.6 + M19.9 · ToolCallChip — chip colapsable estilo Claude.ai
 *
 * M19.9 cambio: estilo UNIFICADO con ToolGroupChip — línea gris zinc-500
 * minimalista cuando cerrado, con request/response al expandir.
 *
 * Estado cerrado:
 *   🔬 Pre-flight check ✓ 5.7s ›
 *   (texto gris zinc-500, sin background fuerte)
 *
 * Estado abierto:
 *   Request + Response JSON formatted
 *
 * Estado running:
 *   🔄 Pre-flight check... (spinner)
 *
 * Estado error:
 *   ✗ Pre-flight check (5.7s) — error visible en abierto
 *
 * Usa @radix-ui/react-accordion.
 */

import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import type { ToolCallDetail } from "@/lib/types/blocks";

interface Props {
  call: ToolCallDetail;
  className?: string;
}

interface ToolMeta {
  label: string;
  icon: string;
  verb: string;
}

const TOOL_META: Record<string, ToolMeta> = {
  preflight_check: { label: "Pre-flight check", icon: "🔬", verb: "Revisó" },
  brave_search: { label: "Brave Search", icon: "🔎", verb: "Buscó en" },
  smart_search: { label: "Smart Search", icon: "🔎", verb: "Buscó con" },
  legal_data_hunter: { label: "Legal Data Hunter", icon: "📚", verb: "Consultó" },
  judge: { label: "Judge LLM", icon: "⚖", verb: "Validó con" },
  search_internal_db: { label: "BD interna", icon: "💾", verb: "Consultó" },
  fetch_corte_cc: { label: "Corte Constitucional", icon: "🏛", verb: "Consultó" },
  fetch_csj_rss: { label: "Corte Suprema", icon: "🏛", verb: "Consultó" },
  fetch_senado_suin: { label: "Senado / SUIN", icon: "📜", verb: "Consultó" },
  lookup_articulo_chunks: { label: "RAG corpus", icon: "🔍", verb: "Buscó en" },
  check_derogation: { label: "Vigencia", icon: "⏱", verb: "Verificó" },
  fetch_web_search_official: { label: "Web oficial", icon: "🌐", verb: "Buscó en" },
  section_planner: { label: "Plan de secciones", icon: "📋", verb: "Planificó" },
};

function getMeta(name: string): ToolMeta {
  return TOOL_META[name] || {
    label: name.replace(/_/g, " "),
    icon: "🔧",
    verb: "Usó",
  };
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return "";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

export function ToolCallChip({ call, className = "" }: Props) {
  const meta = getMeta(call.name);
  const isRunning = call.status === "running";
  const isError = call.status === "error";

  // Icono de estado a la izquierda del label
  const stateIcon = isRunning ? (
    <span
      aria-label="cargando"
      className="inline-block w-3 h-3 border-[1.5px] border-zinc-400 border-t-transparent rounded-full animate-spin"
    />
  ) : isError ? (
    <span className="text-red-500" aria-label="error">✗</span>
  ) : (
    <span className="text-zinc-400" aria-label="ok">✓</span>
  );

  return (
    <Accordion.Root
      type="single"
      collapsible
      className={`tool-call-wrapper inline-block ${className}`}
    >
      <Accordion.Item value={call.id} className="group">
        <Accordion.Header asChild>
          <Accordion.Trigger asChild>
            <button
              type="button"
              className={`
                tool-call-chip
                inline-flex items-center gap-1.5
                text-[12.5px] leading-tight
                ${isError ? "text-red-600 hover:text-red-800" : "text-zinc-500 hover:text-zinc-800"}
                transition-colors
                py-1 cursor-pointer
                font-normal
              `}
              style={{
                background: "transparent",
                border: "none",
                padding: "4px 0",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
              aria-label={meta.label}
            >
              <span aria-hidden style={{ opacity: 0.85, fontSize: 12 }}>{meta.icon}</span>
              <span>{meta.label}</span>
              <span aria-hidden style={{ opacity: 0.85 }}>{stateIcon}</span>
              {!isRunning && call.durationMs != null && call.durationMs > 0 && (
                <span
                  className="text-zinc-400"
                  style={{ fontSize: "11px", fontFamily: "ui-monospace, monospace" }}
                >
                  · {formatDuration(call.durationMs)}
                </span>
              )}
              <ChevronRight
                aria-hidden
                className="w-3.5 h-3.5 transition-transform group-data-[state=open]:rotate-90 text-zinc-400"
              />
            </button>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
          <div className="mt-1.5 ml-4 border border-zinc-200 rounded-md bg-white overflow-hidden text-zinc-900 max-w-xl">
            {call.error && (
              <div className="px-3 py-1.5 text-[11px] text-red-700 bg-red-50 border-b border-red-200">
                <span className="font-semibold">Error:</span> {call.error}
              </div>
            )}
            {call.request !== undefined && call.request !== null && (
              <JsonBlock label="Request" data={call.request} accent="zinc" />
            )}
            {call.response !== undefined && call.response !== null && (
              <JsonBlock label="Response" data={call.response} accent="emerald" />
            )}
            {(call.request == null && call.response == null && !call.error) && (
              <div className="px-3 py-2 text-[11px] text-zinc-500 italic">Sin detalle disponible</div>
            )}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function JsonBlock({ label, data, accent }: { label: string; data: any; accent: "zinc" | "emerald" }) {
  const formatted = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  const labelBg =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : "bg-zinc-50 text-zinc-700 border-zinc-200";

  return (
    <div className="border-b border-zinc-200 last:border-b-0">
      <div className={`px-3 py-1 text-[9.5px] font-bold uppercase tracking-wider border-b ${labelBg}`}>
        {label}
      </div>
      <pre className="text-[10.5px] leading-tight px-3 py-2 max-h-56 overflow-auto bg-white text-zinc-700 font-mono whitespace-pre-wrap break-all">
        {formatted}
      </pre>
    </div>
  );
}
