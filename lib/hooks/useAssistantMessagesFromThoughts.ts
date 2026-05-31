"use client";

/**
 * Sprint M19.6 + M19.9 · useAssistantMessagesFromThoughts
 *
 * Convierte AgentThought[] en una lista de AssistantNarrativeMessage[]
 * estilo Claude: CADA PARAGRAPH genera UN MENSAJE separado en el thread,
 * y los tool calls que vienen DESPUÉS de ese paragraph y ANTES del siguiente
 * paragraph se asocian a ese mensaje.
 *
 * M19.9: tools consecutivos (≥2) sin paragraph entre ellos se AGRUPAN
 * en un segment `tool_group` que el frontend renderiza colapsado como
 * "Usó N herramientas ›" estilo Claude.ai (NO N chips sueltos).
 *
 * Reglas:
 *   - kind="narration"   → cierra mensaje actual, abre nuevo paragraph
 *   - kind="tool_call"   → buffer de tools del mensaje activo (merge por toolId)
 *                          al cerrar mensaje o llegar paragraph nuevo:
 *                            si ≥2 tools → segment "tool_group"
 *                            si 1 tool   → segment "tool" individual
 *   - kind="presented_file" → segment especial PresentedFileChip
 *   - kind="correction|warning|success|info|error" → paragraph con prefijo
 */

import { useMemo } from "react";
import type {
  AgentThought,
  AssistantNarrativeMessage,
  AssistantSegment,
  ToolCallDetail,
} from "@/lib/types/blocks";

export function useAssistantMessagesFromThoughts(
  thoughts: AgentThought[],
  status: string,
): AssistantNarrativeMessage[] {
  return useMemo(() => buildMessages(thoughts, status), [thoughts, status]);
}

function buildMessages(
  thoughts: AgentThought[],
  status: string,
): AssistantNarrativeMessage[] {
  if (thoughts.length === 0) return [];

  const isStreaming = status === "running";
  const sorted = [...thoughts].sort((a, b) => a.timestamp - b.timestamp);

  const messages: AssistantNarrativeMessage[] = [];
  let currentMsg: AssistantNarrativeMessage | null = null;
  // Buffer de tools consecutivos del mensaje activo (M19.9)
  // Se flushea cuando llega paragraph o termina el mensaje.
  let toolBuffer: ToolCallDetail[] = [];
  const toolById = new Map<string, ToolCallDetail>();

  const flushTools = () => {
    if (toolBuffer.length === 0 || !currentMsg) return;
    if (toolBuffer.length >= 2) {
      // M19.9: ≥2 tools consecutivos → tool_group
      const first = toolBuffer[0]!;
      currentMsg.segments.push({
        type: "tool_group",
        id: `tg-${currentMsg.id}-${currentMsg.segments.length}`,
        tools: [...toolBuffer],
        timestamp: first.startedAt,
      });
    } else {
      // 1 sólo tool → segment individual
      const only = toolBuffer[0]!;
      currentMsg.segments.push({
        type: "tool",
        id: `t-${only.id}`,
        tool: only,
        timestamp: only.startedAt,
      });
    }
    toolBuffer = [];
  };

  const closeCurrent = () => {
    if (currentMsg) {
      flushTools();
      currentMsg.finishedAt = currentMsg.segments[currentMsg.segments.length - 1]?.timestamp ?? currentMsg.startedAt;
      currentMsg.isStreaming = false;
      messages.push(currentMsg);
      currentMsg = null;
    }
  };

  const ensureMsg = (ts: number) => {
    if (!currentMsg) {
      currentMsg = {
        id: `am-${ts}-${Math.random().toString(36).slice(2, 8)}`,
        role: "assistant",
        segments: [],
        startedAt: ts,
        finishedAt: null,
        isStreaming: true,
      };
    }
    return currentMsg;
  };

  for (const t of sorted) {
    const isParagraphKind =
      t.kind === "narration" ||
      t.kind === "correction" ||
      t.kind === "warning" ||
      t.kind === "success" ||
      t.kind === "info" ||
      t.kind === "error";

    if (isParagraphKind && t.message) {
      // Antes de cerrar el mensaje viejo, flush los tools pendientes
      closeCurrent();
      const msg = ensureMsg(t.timestamp);
      msg.segments.push({
        type: "paragraph",
        id: t.id,
        markdown: formatParagraph(t),
        timestamp: t.timestamp,
      });
      continue;
    }

    if (t.kind === "tool_call") {
      ensureMsg(t.timestamp);
      const toolId = t.toolId || t.id;
      const existing = toolById.get(toolId);
      const isError = t.toolError != null;
      const isDone = t.toolResponse !== undefined && t.toolResponse !== null;

      if (existing) {
        // Update tool existente in-place (running → done/error). Mismo objeto, mutable.
        existing.status = isError ? "error" : isDone ? "done" : "running";
        if (t.toolRequest !== undefined && t.toolRequest !== null) existing.request = t.toolRequest;
        if (t.toolResponse !== undefined && t.toolResponse !== null) existing.response = t.toolResponse;
        if (t.toolError) existing.error = t.toolError;
        if (t.toolDurationMs != null) existing.durationMs = t.toolDurationMs;
      } else {
        const detail: ToolCallDetail = {
          id: toolId,
          name: t.tool || "tool",
          status: isError ? "error" : isDone ? "done" : "running",
          request: t.toolRequest ?? undefined,
          response: t.toolResponse ?? undefined,
          error: t.toolError ?? null,
          durationMs: t.toolDurationMs ?? null,
          startedAt: t.timestamp,
        };
        toolById.set(toolId, detail);
        // M19.9: buffer en lugar de push directo. Flush ocurre al cerrar mensaje
        // o al llegar paragraph.
        toolBuffer.push(detail);
      }
      continue;
    }

    // M19.7: presented_file kind (DOCX listo). Segment especial, NO se agrupa.
    if ((t.kind as any) === "presented_file") {
      // Flush tools pendientes antes para mantener orden temporal
      flushTools();
      const msg = ensureMsg(t.timestamp);
      msg.segments.push({
        type: "tool",
        id: `pf-${t.id}`,
        tool: {
          id: `pf-${t.id}`,
          name: "presented_file",
          status: "done",
          request: undefined,
          response: t.toolResponse ?? {
            name: t.message,
            url: t.url || undefined,
          },
          error: null,
          durationMs: null,
          startedAt: t.timestamp,
        },
        timestamp: t.timestamp,
      });
    }
  }

  // M20.14 Fix A: cuando el stream YA NO está corriendo (status="completed",
  // "error" o "aborted"), cualquier tool que quedó con status="running" debe
  // marcarse como "done" — el Brain ya cerró el loop y esos tools no van a
  // recibir su completion. Sin esto, el ToolGroupChip mostraba para siempre
  // "Verificando citas... 0/N · pensando..." aunque la generación terminara.
  if (!isStreaming) {
    for (const tool of toolById.values()) {
      if (tool.status === "running") {
        tool.status = "done";
        if (tool.durationMs == null && tool.startedAt) {
          tool.durationMs = Date.now() - tool.startedAt;
        }
      }
    }
  }

  // Flush último buffer + cerrar último mensaje
  if (currentMsg) {
    flushTools();
    (currentMsg as AssistantNarrativeMessage).isStreaming = isStreaming;
    (currentMsg as AssistantNarrativeMessage).finishedAt = isStreaming ? null : Date.now();
    messages.push(currentMsg);
  }

  return messages;
}

function formatParagraph(t: AgentThought): string {
  if (t.kind === "narration" || t.kind === "success" || t.kind === "info") {
    return t.message;
  }
  if (t.kind === "correction") {
    let s = `💡 **Sugerencia:** ${t.message}`;
    if (t.suggestion) s += `\n\n→ Usar en su lugar: \`${t.suggestion}\``;
    return s;
  }
  if (t.kind === "warning") return `⚖ ${t.message}`;
  if (t.kind === "error") return `⚠ ${t.message}`;
  return t.message;
}
