"use client";

/**
 * Sprint M19.9 · ToolGroupChip — agrupa ≥2 tool calls consecutivos
 *                                  en una línea colapsable estilo Claude.ai
 *
 * Estado cerrado (default):
 *   🔍 Verificó 19 citas usando 4 fuentes · 1.2s  ›
 *
 * Estado abierto: lista vertical de cada ToolCallChip individual
 *
 * Estilo:
 *   - Color: gris zinc-500 (Claude-style)
 *   - Sin background fuerte (texto puro + hover sutil)
 *   - Tipografía sistema, no serif
 *   - Chevron pequeño
 *
 * Estado running:
 *   🔄 Verificando citas... 12/19 · 5.4s
 *   (spinner animado, contador progresivo)
 */

import * as React from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import { ToolCallChip } from "@/components/assistant/ToolCallChip";
import type { ToolCallDetail } from "@/lib/types/blocks";

interface Props {
  tools: ToolCallDetail[];
  className?: string;
}

// Etiquetas legibles por tool name (debe coincidir con ToolCallChip)
const TOOL_LABELS: Record<string, { label: string; verb: string }> = {
  preflight_check: { label: "Pre-flight", verb: "revisó" },
  brave_search: { label: "Brave Search", verb: "buscó" },
  smart_search: { label: "Smart Search", verb: "buscó" },
  legal_data_hunter: { label: "Legal Data Hunter", verb: "consultó" },
  judge: { label: "Judge LLM", verb: "validó" },
  search_internal_db: { label: "BD interna", verb: "consultó" },
  fetch_corte_cc: { label: "Corte Constitucional", verb: "consultó" },
  fetch_csj_rss: { label: "Corte Suprema", verb: "consultó" },
  fetch_senado_suin: { label: "Senado / SUIN", verb: "consultó" },
  lookup_articulo_chunks: { label: "RAG corpus", verb: "buscó" },
  check_derogation: { label: "Vigencia", verb: "verificó" },
  fetch_web_search_official: { label: "Web oficial", verb: "buscó" },
  section_planner: { label: "Plan de secciones", verb: "planificó" },
};

function uniqueRefs(tools: ToolCallDetail[]): string[] {
  const refs = new Set<string>();
  tools.forEach((t) => {
    const ref = (t.request as any)?.normalized || (t.request as any)?.tipo;
    if (ref && typeof ref === "string") refs.add(ref);
  });
  return Array.from(refs);
}

function summarize(tools: ToolCallDetail[]): { label: string; counter: string } {
  const total = tools.length;
  const byName = new Map<string, number>();
  tools.forEach((t) => byName.set(t.name, (byName.get(t.name) || 0) + 1));
  const uniqueNames = Array.from(byName.keys());
  const refs = uniqueRefs(tools);
  const nCitas = refs.length;

  // Caso 1: todas del mismo tool name
  if (uniqueNames.length === 1) {
    const name = uniqueNames[0]!;
    const meta = TOOL_LABELS[name] || { label: name, verb: "usó" };
    return {
      label: `${capitalize(meta.verb)} ${total}× ${meta.label}`,
      counter: `${total}`,
    };
  }

  // Caso 2: pocas fuentes, las listamos
  if (uniqueNames.length <= 3 && total <= 6) {
    const labels = uniqueNames.map((n) => TOOL_LABELS[n]?.label || n).join(", ");
    return {
      label: `Usó ${labels}`,
      counter: `${total}`,
    };
  }

  // Caso 3: muchas tools sobre múltiples citas → resumen inteligente
  if (nCitas >= 2) {
    return {
      label: `Verificó ${nCitas} citas usando ${uniqueNames.length} fuentes`,
      counter: `${total}`,
    };
  }

  // Caso 4: fallback genérico
  return {
    label: `Usó ${total} herramientas (${uniqueNames.length} fuentes)`,
    counter: `${total}`,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDuration(ms: number | null): string {
  if (ms == null || ms <= 0) return "";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

export function ToolGroupChip({ tools, className = "" }: Props) {
  const { label, counter } = React.useMemo(() => summarize(tools), [tools]);

  const total = tools.length;
  const nDone = tools.filter((t) => t.status === "done").length;
  const nError = tools.filter((t) => t.status === "error").length;
  const nRunning = tools.filter((t) => t.status === "running").length;
  const allDone = nRunning === 0 && nError === 0;
  const isRunning = nRunning > 0;
  const hasError = nError > 0;

  const totalDurationMs = tools.reduce(
    (sum, t) => sum + (typeof t.durationMs === "number" ? t.durationMs : 0),
    0,
  );

  // Iconos: spinner si running, ✗ si hay error pero ya terminó, ✓ si done
  const stateIcon = isRunning ? (
    <span
      aria-label="cargando"
      className="inline-block w-3 h-3 border-[1.5px] border-zinc-400 border-t-transparent rounded-full animate-spin"
    />
  ) : hasError ? (
    <span className="text-red-500" aria-label="error">✗</span>
  ) : (
    <span className="text-zinc-400" aria-label="ok">✓</span>
  );

  // Etiqueta dinámica según estado
  const displayLabel = isRunning
    ? `Verificando citas... ${nDone + nError}/${total}`
    : label;

  return (
    <Accordion.Root
      type="single"
      collapsible
      className={`tool-group-wrapper ${className}`}
    >
      <Accordion.Item value="group" className="group">
        <Accordion.Header asChild>
          <Accordion.Trigger asChild>
            <button
              type="button"
              className="
                tool-group-chip
                inline-flex items-center gap-1.5
                text-[12.5px] leading-tight
                text-zinc-500 hover:text-zinc-800
                transition-colors
                py-1 cursor-pointer
                font-normal
              "
              style={{
                background: "transparent",
                border: "none",
                padding: "4px 0",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
              aria-label={displayLabel}
            >
              <span aria-hidden style={{ opacity: 0.85 }}>{stateIcon}</span>
              <span>{displayLabel}</span>
              {allDone && totalDurationMs > 0 && (
                <span
                  className="text-zinc-400"
                  style={{ fontSize: "11px", fontFamily: "ui-monospace, monospace" }}
                >
                  · {formatDuration(totalDurationMs)}
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
          <div
            className="mt-1 ml-4 pl-2 border-l border-zinc-200 flex flex-col gap-1 py-1"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            {tools.map((tool, idx) => (
              <div
                key={tool.id}
                className="tool-group-item-enter"
                style={{
                  // M19.9: animación de entrada secuencial
                  animationDelay: `${idx * 30}ms`,
                }}
              >
                <ToolCallChip call={tool} />
              </div>
            ))}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
