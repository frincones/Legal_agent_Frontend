"use client";

/**
 * Sprint M19.6 · useAssistantMessagesFromThoughts (refactor)
 *
 * Convierte AgentThought[] en una lista de AssistantNarrativeMessage[]
 * estilo Claude: CADA PARAGRAPH genera UN MENSAJE separado en el thread,
 * y los tool calls que vienen DESPUÉS de ese paragraph y ANTES del siguiente
 * paragraph se asocian a ese mensaje.
 *
 * Regla M19.6 (cambio vs M19.5):
 *   - Antes: agrupábamos TODOS los thoughts por threadId en 1 mensaje grande.
 *   - Ahora: cada paragraph crea un nuevo mensaje. Los tool calls siguientes
 *     hasta el próximo paragraph se asocian a ese mensaje. Si llegan tool
 *     calls SIN paragraph previo, crean un mensaje "implícito" con segments
 *     solo de tools.
 *
 * Esto produce el feel Claude: prosa → tools → prosa → tools → prosa, donde
 * cada prosa es un mensaje del agente separado, no un blob.
 *
 * Reglas de kind:
 *   - kind="narration"   → cierra mensaje actual, abre nuevo paragraph
 *   - kind="tool_call"   → agrega al mensaje activo (merge por toolId)
 *   - kind="correction"  → paragraph con prefijo "💡 Sugerencia: ..."
 *   - kind="warning"     → paragraph con prefijo "⚖ ..."
 *   - kind="success"     → paragraph (sin prefijo)
 *   - kind="info"        → paragraph (legacy)
 *   - kind="error"       → paragraph con prefijo "⚠ ..."
 *   - kind="presented_file" → segment especial con metadata DOCX (M19.7)
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
  const toolById = new Map<string, ToolCallDetail>();

  const closeCurrent = () => {
    if (currentMsg) {
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
      // Nuevo paragraph: cierra mensaje anterior, abre uno nuevo
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
      // Tool calls van al mensaje activo. Si no hay, crea uno "implícito".
      const msg = ensureMsg(t.timestamp);
      const toolId = t.toolId || t.id;
      const existing = toolById.get(toolId);
      const isError = t.toolError != null;
      const isDone = t.toolResponse !== undefined && t.toolResponse !== null;

      if (existing) {
        // Update tool existente (running → done/error). Mismo segmento, mutable.
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
        msg.segments.push({
          type: "tool",
          id: `tool-${toolId}`,
          tool: detail,
          timestamp: t.timestamp,
        });
      }
      continue;
    }

    // M19.7: presented_file kind (DOCX listo). Segment especial.
    if ((t.kind as any) === "presented_file") {
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

  // Cerrar último mensaje
  if (currentMsg) {
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
