"use client";

/**
 * Sprint M19.5 + M19.6 + M19.7 · AssistantNarrativeMessage
 *
 * Renderiza UN mensaje del agente (típicamente 1 paragraph + N tool chips
 * o tools sueltos). Estilo Claude.ai:
 *  - Tipografía serif para prosa
 *  - Tool chips en línea continua bajo el paragraph
 *  - PresentedFileChip especial para .docx (M19.7)
 *  - Streaming indicator si está en curso
 */

import * as React from "react";
import { MarkdownContent } from "@/components/assistant/MarkdownContent";
import { ToolCallChip } from "@/components/assistant/ToolCallChip";
import { ToolGroupChip } from "@/components/assistant/ToolGroupChip";
import { PresentedFileChip } from "@/components/assistant/PresentedFileChip";
import type { AssistantNarrativeMessage as Msg } from "@/lib/types/blocks";

interface Props {
  message: Msg;
  className?: string;
}

export function AssistantNarrativeMessage({ message, className = "" }: Props) {
  // M19.6: renderizar segments EN ORDEN sin agrupar (cada uno en su propio espacio)
  return (
    <article
      className={`assistant-narrative-message ${className}`}
      style={{
        fontFamily: '"Source Serif Pro", "Tiempos Text", Georgia, serif',
        fontSize: "14.5px",
        lineHeight: "1.7",
        color: "rgb(38, 38, 41)",
        padding: "10px 0",
      }}
    >
      {message.segments.map((seg) => {
        if (seg.type === "paragraph") {
          return (
            <div key={seg.id} className="assistant-paragraph" style={{ marginBottom: 8 }}>
              <MarkdownContent source={seg.markdown} density="normal" />
            </div>
          );
        }
        // M19.9: tool_group → línea colapsable estilo Claude
        if (seg.type === "tool_group") {
          return (
            <div
              key={seg.id}
              style={{
                marginTop: 2,
                marginBottom: 4,
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              <ToolGroupChip tools={seg.tools} />
            </div>
          );
        }
        // seg.type === "tool" (individual)
        // M19.7: PresentedFileChip especial para archivos .docx
        if (seg.tool.name === "presented_file") {
          return (
            <div
              key={seg.id}
              style={{
                marginBottom: 8,
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              <PresentedFileChip tool={seg.tool} />
            </div>
          );
        }
        // Tool call regular individual (poco común tras M19.9: la mayoría se agrupa)
        return (
          <div
            key={seg.id}
            style={{
              marginTop: 2,
              marginBottom: 2,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            <ToolCallChip call={seg.tool} />
          </div>
        );
      })}

      {message.isStreaming && (
        <div
          className="inline-block mt-1 text-[11px] text-zinc-400 italic"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          <span className="animate-pulse">●</span> pensando…
        </div>
      )}
    </article>
  );
}
