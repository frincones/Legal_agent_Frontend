"use client";

/**
 * Sprint M19.5 · useAssistantMessagesFromThoughts
 *
 * Convierte el stream raw de AgentThought[] del backend en una lista de
 * "AssistantNarrativeMessage" agrupados por threadId. Cada mensaje del
 * agente puede contener segmentos: párrafos de prosa (markdown) + tool
 * calls colapsables, ordenados temporalmente como Claude.ai.
 *
 * Reglas de agrupación:
 *   - thoughts con mismo threadId → mismo mensaje
 *   - kind="narration"   → segmento paragraph
 *   - kind="tool_call"   → segmento tool (merge por toolId si está running→done)
 *   - kind="correction"  → segmento paragraph (resaltado en el render)
 *   - kind="warning"     → segmento paragraph
 *   - kind="success"     → segmento paragraph
 *   - kind="info"        → segmento paragraph (legacy)
 *   - kind="error"       → segmento paragraph
 *
 * Si un thought NO tiene threadId, se agrupa en "default" thread.
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

  // Agrupar por threadId
  const byThread = new Map<string, AgentThought[]>();
  for (const t of thoughts) {
    const tid = t.threadId || "default";
    const arr = byThread.get(tid) || [];
    arr.push(t);
    byThread.set(tid, arr);
  }

  const messages: AssistantNarrativeMessage[] = [];
  for (const [threadId, ts] of byThread.entries()) {
    const sorted = [...ts].sort((a, b) => a.timestamp - b.timestamp);
    const segments = buildSegments(sorted);
    const startedAt = sorted[0]?.timestamp ?? Date.now();
    const lastTs = sorted[sorted.length - 1]?.timestamp ?? startedAt;
    messages.push({
      id: threadId,
      role: "assistant",
      segments,
      startedAt,
      finishedAt: status === "running" ? null : lastTs,
      isStreaming: status === "running",
    });
  }

  return messages;
}

function buildSegments(thoughts: AgentThought[]): AssistantSegment[] {
  const segments: AssistantSegment[] = [];
  const toolById = new Map<string, ToolCallDetail>();
  const toolSegmentByToolId = new Map<string, AssistantSegment>();

  for (const t of thoughts) {
    if (t.kind === "tool_call") {
      // Merge por toolId (running → done correlaciona)
      const toolId = t.toolId || t.id;
      const existing = toolById.get(toolId);
      const isDone = t.toolResponse !== undefined && t.toolResponse !== null;
      const isError = t.toolError != null;

      if (existing) {
        // Update existente: actualizar status/response/error/duration
        existing.status = isError ? "error" : isDone ? "done" : "running";
        if (t.toolRequest !== undefined && t.toolRequest !== null) existing.request = t.toolRequest;
        if (t.toolResponse !== undefined && t.toolResponse !== null) existing.response = t.toolResponse;
        if (t.toolError) existing.error = t.toolError;
        if (t.toolDurationMs != null) existing.durationMs = t.toolDurationMs;
        // El segmento ya está en `segments` con esa referencia (mutable)
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
        const seg: AssistantSegment = {
          type: "tool",
          id: `tool-${toolId}`,
          tool: detail,
          timestamp: t.timestamp,
        };
        toolSegmentByToolId.set(toolId, seg);
        segments.push(seg);
      }
      continue;
    }

    // Resto de kinds → paragraph
    if (t.message) {
      segments.push({
        type: "paragraph",
        id: t.id,
        markdown: formatParagraph(t),
        timestamp: t.timestamp,
      });
    }
  }

  return segments;
}

function formatParagraph(t: AgentThought): string {
  // Prefijos cosméticos por kind (solo para los no-narration / no-success limpios)
  if (t.kind === "narration" || t.kind === "success") {
    return t.message;
  }
  if (t.kind === "correction") {
    let s = `💡 **Sugerencia:** ${t.message}`;
    if (t.suggestion) s += `\n\n→ Usar en su lugar: \`${t.suggestion}\``;
    return s;
  }
  if (t.kind === "warning") return `⚖ ${t.message}`;
  if (t.kind === "error") return `⚠ ${t.message}`;
  // legacy "info" o "tool_result"
  return t.message;
}
