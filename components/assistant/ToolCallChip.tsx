"use client";

/**
 * Sprint M19.5 + M19.6 · ToolCallChip — chip colapsable estilo Claude.ai
 *
 * Renderiza un tool call con:
 *  - Chip compacto: [🔎 Brave Search ✓ 420ms ›]
 *  - Expandible (click): Request + Response en JSON formatted
 *
 * M19.6 cambios:
 *  - Más compacto (font-size 11px, padding reducido)
 *  - CSS tokens por tool type (brave verde, judge ámbar, etc.)
 *  - Etiqueta en español más natural
 *
 * Usa @radix-ui/react-accordion (instalado).
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
  bgVar: string;
  textVar: string;
}

const TOOL_META: Record<string, ToolMeta> = {
  preflight_check: { label: "Pre-flight check", icon: "🔬", bgVar: "var(--tool-preflight-bg)", textVar: "var(--tool-preflight-text)" },
  brave_search: { label: "Brave Search", icon: "🔎", bgVar: "var(--tool-brave-bg)", textVar: "var(--tool-brave-text)" },
  smart_search: { label: "Smart Search", icon: "🔎", bgVar: "var(--tool-brave-bg)", textVar: "var(--tool-brave-text)" },
  legal_data_hunter: { label: "Legal Data Hunter", icon: "📚", bgVar: "var(--tool-bd-bg)", textVar: "var(--tool-bd-text)" },
  judge: { label: "Judge LLM", icon: "⚖", bgVar: "var(--tool-judge-bg)", textVar: "var(--tool-judge-text)" },
  search_internal_db: { label: "BD interna", icon: "💾", bgVar: "var(--tool-bd-bg)", textVar: "var(--tool-bd-text)" },
  fetch_corte_cc: { label: "Corte Constitucional", icon: "🏛", bgVar: "var(--tool-corte-bg)", textVar: "var(--tool-corte-text)" },
  fetch_csj_rss: { label: "Corte Suprema", icon: "🏛", bgVar: "var(--tool-corte-bg)", textVar: "var(--tool-corte-text)" },
  fetch_senado_suin: { label: "Senado / SUIN", icon: "📜", bgVar: "var(--tool-bd-bg)", textVar: "var(--tool-bd-text)" },
  lookup_articulo_chunks: { label: "RAG corpus", icon: "🔍", bgVar: "var(--tool-bd-bg)", textVar: "var(--tool-bd-text)" },
  check_derogation: { label: "Vigencia", icon: "⏱", bgVar: "var(--tool-judge-bg)", textVar: "var(--tool-judge-text)" },
  fetch_web_search_official: { label: "Web oficial", icon: "🌐", bgVar: "var(--tool-brave-bg)", textVar: "var(--tool-brave-text)" },
  section_planner: { label: "Plan de secciones", icon: "📋", bgVar: "var(--tool-preflight-bg)", textVar: "var(--tool-preflight-text)" },
};

function getMeta(name: string): ToolMeta {
  return TOOL_META[name] || {
    label: name.replace(/_/g, " "),
    icon: "🔧",
    bgVar: "var(--tool-bg-default)",
    textVar: "var(--tool-text-default)",
  };
}

export function ToolCallChip({ call, className = "" }: Props) {
  const meta = getMeta(call.name);
  const isRunning = call.status === "running";
  const isError = call.status === "error";

  // M19.6: chip estado override colors si running/error
  const chipStyle: React.CSSProperties = isError
    ? { backgroundColor: "var(--tool-bg-error)", borderColor: "var(--tool-border-error)", color: "var(--tool-text-error)" }
    : isRunning
    ? { backgroundColor: "var(--tool-bg-running)", borderColor: "var(--tool-border-running)", color: "var(--tool-text-running)" }
    : { backgroundColor: meta.bgVar, borderColor: "rgb(228 228 231)", color: meta.textVar };

  const statusIcon = isRunning ? (
    <span
      className="inline-block w-2 h-2 border-[1.5px] border-current border-t-transparent rounded-full animate-spin"
      aria-label="cargando"
      style={{ opacity: 0.7 }}
    />
  ) : isError ? (
    <span aria-label="error" style={{ opacity: 0.9 }}>✗</span>
  ) : (
    <span aria-label="ok" style={{ opacity: 0.9 }}>✓</span>
  );

  return (
    <Accordion.Root
      type="single"
      collapsible
      className={`inline-block ${className}`}
    >
      <Accordion.Item value={call.id} className="group">
        <Accordion.Header asChild>
          <Accordion.Trigger asChild>
            <button
              className={`
                inline-flex items-center gap-1.5
                px-2 py-[3px] border rounded-md
                text-[11px] font-medium
                transition-all
                hover:brightness-95
              `}
              style={chipStyle}
              type="button"
              aria-label={`Tool ${meta.label}`}
            >
              <span aria-hidden style={{ fontSize: 11 }}>{meta.icon}</span>
              <span>{meta.label}</span>
              {statusIcon}
              {call.durationMs != null && (
                <span style={{ opacity: 0.6, fontFamily: "ui-monospace, monospace", fontSize: 10 }}>
                  {call.durationMs}ms
                </span>
              )}
              <ChevronRight
                aria-hidden
                className="w-3 h-3 transition-transform group-data-[state=open]:rotate-90"
                style={{ opacity: 0.5 }}
              />
            </button>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
          <div className="mt-1.5 border border-zinc-200 rounded-md bg-white overflow-hidden text-zinc-900 max-w-xl">
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
