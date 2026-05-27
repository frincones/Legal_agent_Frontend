"use client";

/**
 * Sprint M19.5 · AssistantNarrativeMessage — mensaje del agente estilo Claude.ai
 *
 * Renderiza una secuencia de segmentos (párrafos markdown + tool calls
 * colapsables) en orden temporal. Sin bubble. Sin background. Solo prosa
 * limpia con tipografía serif y chips compactos para tools.
 *
 * Reuso de componentes existentes:
 *  - MarkdownContent (parser markdown completo, zero deps)
 *  - ToolCallChip (nuevo M19.5)
 */

import * as React from "react";
import { MarkdownContent } from "@/components/assistant/MarkdownContent";
import { ToolCallChip } from "@/components/assistant/ToolCallChip";
import type { AssistantNarrativeMessage as Msg, AssistantSegment } from "@/lib/types/blocks";

interface Props {
  message: Msg;
  className?: string;
}

export function AssistantNarrativeMessage({ message, className = "" }: Props) {
  // Renderizar segments en orden, agrupando tool chips consecutivos
  // en filas (varios chips alineados) para que no rompan el flow del texto
  const grouped = React.useMemo(() => groupConsecutiveTools(message.segments), [message.segments]);

  return (
    <article
      className={`assistant-narrative-message ${className}`}
      style={{
        // Estilo Claude: tipografía serif para prosa, generoso whitespace
        fontFamily: '"Source Serif Pro", "Tiempos Text", Georgia, serif',
        fontSize: "14px",
        lineHeight: "1.65",
        color: "rgb(38, 38, 41)",
        padding: "8px 0",
      }}
    >
      {grouped.map((group, idx) => {
        if (group.type === "paragraph") {
          return (
            <div
              key={group.id}
              style={{ marginBottom: idx < grouped.length - 1 ? "12px" : 0 }}
            >
              <MarkdownContent source={group.markdown} density="normal" />
            </div>
          );
        }
        // group.type === "tools" — chips agrupados en una fila
        return (
          <div
            key={`tools-${idx}`}
            className="flex flex-wrap items-center gap-1 my-2"
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            {group.tools.map((tool) => (
              <ToolCallChip key={tool.id} call={tool} />
            ))}
          </div>
        );
      })}

      {message.isStreaming && (
        <div
          className="inline-block mt-2 text-[11px] text-zinc-500 italic animate-pulse"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          ● procesando…
        </div>
      )}
    </article>
  );
}

type Grouped =
  | { type: "paragraph"; id: string; markdown: string }
  | { type: "tools"; tools: Array<{ id: string; name: string; status: any; request?: any; response?: any; error?: any; durationMs?: any; startedAt: number }> };

function groupConsecutiveTools(segments: AssistantSegment[]): Grouped[] {
  const out: Grouped[] = [];
  let currentTools: any[] = [];

  const flushTools = () => {
    if (currentTools.length > 0) {
      out.push({ type: "tools", tools: currentTools });
      currentTools = [];
    }
  };

  for (const seg of segments) {
    if (seg.type === "tool") {
      currentTools.push(seg.tool);
    } else {
      flushTools();
      out.push({ type: "paragraph", id: seg.id, markdown: seg.markdown });
    }
  }
  flushTools();
  return out;
}
