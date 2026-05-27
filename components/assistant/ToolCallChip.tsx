"use client";

/**
 * Sprint M19.5 · ToolCallChip — chip colapsable estilo Claude.ai
 *
 * Renderiza un tool call con:
 *  - Chip compacto: [🔧 brave_search ✓ 420ms ›]
 *  - Expandible (click): muestra request + response en JSON formatted
 *
 * Usa @radix-ui/react-accordion (ya instalado).
 */

import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import type { ToolCallDetail } from "@/lib/types/blocks";

interface Props {
  call: ToolCallDetail;
  className?: string;
}

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  preflight_check: { label: "pre-flight check", icon: "🔬" },
  brave_search: { label: "Brave Search", icon: "🔎" },
  smart_search: { label: "Smart Search", icon: "🔎" },
  legal_data_hunter: { label: "Legal Data Hunter", icon: "📚" },
  judge: { label: "Judge LLM", icon: "⚖" },
  search_internal_db: { label: "BD interna", icon: "💾" },
  fetch_corte_cc: { label: "Corte Constitucional", icon: "🏛" },
  fetch_csj_rss: { label: "Corte Suprema (RSS)", icon: "🏛" },
  fetch_senado_suin: { label: "Senado / SUIN", icon: "📜" },
  lookup_articulo_chunks: { label: "RAG corpus", icon: "🔍" },
  check_derogation: { label: "Vigencia", icon: "⏱" },
  fetch_web_search_official: { label: "Web oficial", icon: "🌐" },
};

export function ToolCallChip({ call, className = "" }: Props) {
  const meta = TOOL_LABELS[call.name] || { label: call.name.replace(/_/g, " "), icon: "🔧" };
  const isRunning = call.status === "running";
  const isError = call.status === "error";

  const statusIcon = isRunning ? (
    <span className="inline-block w-2.5 h-2.5 border-2 border-zinc-400 border-t-zinc-700 rounded-full animate-spin" aria-label="cargando" />
  ) : isError ? (
    <span className="text-red-600" aria-label="error">✗</span>
  ) : (
    <span className="text-emerald-600" aria-label="ok">✓</span>
  );

  return (
    <Accordion.Root
      type="single"
      collapsible
      className={`inline-block my-1 mr-1 ${className}`}
    >
      <Accordion.Item value={call.id} className="group">
        <Accordion.Header asChild>
          <Accordion.Trigger asChild>
            <button
              className={`
                inline-flex items-center gap-1.5 text-[11px] px-2 py-1
                border rounded-md transition-colors
                ${isError ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" :
                  isRunning ? "bg-blue-50 border-blue-200 text-blue-700" :
                  "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"}
                data-[state=open]:bg-zinc-100
              `}
              type="button"
              aria-label={`Tool ${meta.label}`}
            >
              <span aria-hidden className="text-[12px]">{meta.icon}</span>
              <span className="font-medium">{meta.label}</span>
              {statusIcon}
              {call.durationMs != null && (
                <span className="text-zinc-500 font-mono text-[10px]">{call.durationMs}ms</span>
              )}
              <ChevronRight
                aria-hidden
                className="w-3 h-3 transition-transform group-data-[state=open]:rotate-90"
              />
            </button>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
          <div className="mt-1 mb-2 border border-zinc-200 rounded-md bg-white overflow-hidden">
            {call.error && (
              <div className="px-3 py-2 text-[11px] text-red-700 bg-red-50 border-b border-red-200">
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

  const labelBg = accent === "emerald" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-zinc-50 text-zinc-700 border-zinc-200";

  return (
    <div className="border-b border-zinc-200 last:border-b-0">
      <div className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-wider border-b ${labelBg}`}>
        {label}
      </div>
      <pre className="text-[10px] leading-tight px-3 py-2 max-h-48 overflow-auto bg-white text-zinc-700 font-mono whitespace-pre-wrap break-all">
        {formatted}
      </pre>
    </div>
  );
}
