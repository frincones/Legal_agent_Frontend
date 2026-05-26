"use client";

import { useCallback, useReducer, useRef } from "react";
import type {
  AgentThought,
  Block,
  GenerationState,
  MetaPayload,
  SectionPlanItem,
  SSEEventName,
  TimelineStep,
} from "@/lib/types/blocks";

// ============================================================
// State + reducer
// ============================================================

type Action =
  | { type: "RESET" }
  | { type: "START" }
  | { type: "META"; payload: MetaPayload }
  | { type: "ADD_STEP"; payload: TimelineStep }
  | { type: "UPDATE_STEP"; payload: { id: string; status: TimelineStep["status"]; details?: any } }
  | { type: "BLOCK_EMIT"; payload: Block }
  | { type: "ERROR"; payload: string }
  | { type: "DONE"; payload: { generation_id: string; matter_document_id?: string | null; duration_seconds: number; cost_usd: number } }
  | { type: "AUDIT"; payload: any }
  | { type: "THOUGHT"; payload: AgentThought };

const initialState: GenerationState = {
  generationId: null,
  documentId: null,
  status: "idle",
  startedAt: null,
  finishedAt: null,
  totalCostUsd: 0,
  templateSelected: null,
  sectionsPlan: [],
  blocks: [],
  blocksByOrder: new Map(),
  timeline: [],
  audit: null,
  error: null,
  thoughts: [],
};

function reducer(state: GenerationState, action: Action): GenerationState {
  switch (action.type) {
    case "RESET":
      return { ...initialState, blocksByOrder: new Map() };

    case "START":
      return { ...initialState, status: "running", startedAt: Date.now(), blocksByOrder: new Map() };

    case "META":
      return {
        ...state,
        generationId: action.payload.generation_id,
        templateSelected: action.payload.template_selected,
        sectionsPlan: action.payload.sections_plan,
      };

    case "ADD_STEP":
      return { ...state, timeline: [...state.timeline, action.payload] };

    case "UPDATE_STEP": {
      const now = Date.now();
      const timeline = state.timeline.map((step) =>
        step.id === action.payload.id
          ? {
              ...step,
              status: action.payload.status,
              endedAt: action.payload.status === "completed" || action.payload.status === "error" ? now : step.endedAt,
              durationMs:
                action.payload.status === "completed" || action.payload.status === "error"
                  ? (step.startedAt ? now - step.startedAt : undefined)
                  : step.durationMs,
              details: action.payload.details !== undefined ? { ...step.details, ...action.payload.details } : step.details,
            }
          : step
      );
      return { ...state, timeline };
    }

    case "BLOCK_EMIT": {
      const newMap = new Map(state.blocksByOrder);
      newMap.set(action.payload.block_id, action.payload);
      const blocks = [...state.blocks, action.payload];
      return { ...state, blocks, blocksByOrder: newMap };
    }

    case "ERROR":
      return { ...state, status: "error", error: action.payload, finishedAt: Date.now() };

    case "DONE":
      return {
        ...state,
        status: "completed",
        documentId: action.payload.matter_document_id || null,
        totalCostUsd: action.payload.cost_usd,
        finishedAt: Date.now(),
      };

    case "AUDIT":
      return { ...state, audit: action.payload };

    case "THOUGHT":
      // M18.d: agregar narration al stream (mantener cap 200 thoughts max)
      return {
        ...state,
        thoughts: [...state.thoughts, action.payload].slice(-200),
      };

    default:
      return state;
  }
}

// ============================================================
// SSE parser
// ============================================================

interface SSELine {
  event: SSEEventName;
  data: any;
}

async function* parseSSE(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<SSELine> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const block of lines) {
      const lines2 = block.split("\n");
      let event: string | null = null;
      let data = "";
      for (const line of lines2) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (event && data) {
        try {
          yield { event: event as SSEEventName, data: JSON.parse(data) };
        } catch {
          // ignore malformed
        }
      }
    }
  }
}

// ============================================================
// Public hook
// ============================================================

export interface UseGenerationStreamV2Result {
  state: GenerationState;
  generate: (params: {
    intent: string;
    user_brief?: string;
    matter_id?: string;
    firm_id?: string;
    doc_type?: string;
  }) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

export function useGenerationStreamV2(): UseGenerationStreamV2Result {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const generate = useCallback(
    async (params: {
      intent: string;
      user_brief?: string;
      matter_id?: string;
      firm_id?: string;
      doc_type?: string;
    }) => {
      dispatch({ type: "START" });
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/documents/v2/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          dispatch({ type: "ERROR", payload: `HTTP ${res.status}: ${res.statusText}` });
          return;
        }

        const reader = res.body.getReader();
        for await (const { event, data } of parseSSE(reader)) {
          handleEvent(event, data, dispatch);
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          dispatch({ type: "ERROR", payload: e?.message || "unknown_error" });
        }
      } finally {
        abortRef.current = null;
      }
    },
    []
  );

  return { state, generate, reset, abort };
}

// ============================================================
// Event dispatcher
// ============================================================

function handleEvent(event: SSEEventName, data: any, dispatch: React.Dispatch<Action>) {
  switch (event) {
    case "meta":
      dispatch({ type: "META", payload: data });
      // Seed timeline steps from sections_plan
      data.sections_plan?.forEach((sec: SectionPlanItem) => {
        dispatch({
          type: "ADD_STEP",
          payload: {
            id: `section:${sec.key}`,
            type: "section",
            title: `${sec.roman ? sec.roman + ". " : ""}${sec.title}`,
            status: "pending",
            details: { section_key: sec.key, order: sec.order },
          },
        });
      });
      break;

    case "classification_started":
      dispatch({
        type: "ADD_STEP",
        payload: { id: "classification", type: "classification", title: "Clasificación", status: "in_progress", startedAt: Date.now() },
      });
      break;

    case "classification_done":
      dispatch({
        type: "UPDATE_STEP",
        payload: { id: "classification", status: "completed", details: data },
      });
      break;

    case "extraction_started":
      dispatch({
        type: "ADD_STEP",
        payload: { id: "extraction", type: "extraction", title: "Extracción de datos", status: "in_progress", startedAt: Date.now() },
      });
      break;

    case "extraction_done":
      dispatch({
        type: "UPDATE_STEP",
        payload: { id: "extraction", status: "completed", details: data },
      });
      break;

    case "calculation_started":
      dispatch({
        type: "ADD_STEP",
        payload: { id: "calculation", type: "calculation", title: "Cálculos", status: "in_progress", startedAt: Date.now() },
      });
      break;

    case "calculation_done":
      dispatch({
        type: "UPDATE_STEP",
        payload: { id: "calculation", status: "completed", details: data },
      });
      break;

    case "hunters_started":
      dispatch({
        type: "ADD_STEP",
        payload: { id: "hunters", type: "hunters", title: "Jurisprudencia + normas", status: "in_progress", startedAt: Date.now() },
      });
      break;

    case "jurisprudence_query":
      dispatch({
        type: "UPDATE_STEP",
        payload: { id: "hunters", status: "in_progress", details: { last_query: data } },
      });
      break;

    case "hunters_done":
      dispatch({
        type: "UPDATE_STEP",
        payload: { id: "hunters", status: "completed", details: data },
      });
      break;

    case "derogation_done":
      dispatch({
        type: "ADD_STEP",
        payload: { id: "derogation", type: "derogation", title: "Vigencia normativa", status: "completed", startedAt: Date.now(), endedAt: Date.now(), details: data },
      });
      break;

    case "section_started":
      dispatch({
        type: "UPDATE_STEP",
        payload: { id: `section:${data.section_key}`, status: "in_progress" },
      });
      break;

    case "block_emit":
      if (data.block) dispatch({ type: "BLOCK_EMIT", payload: data.block as Block });
      break;

    case "section_done":
      dispatch({
        type: "UPDATE_STEP",
        payload: { id: `section:${data.section_key}`, status: "completed" },
      });
      break;

    case "polish_started":
      dispatch({
        type: "ADD_STEP",
        payload: { id: "polish", type: "polish", title: "Polish pass", status: "in_progress", startedAt: Date.now() },
      });
      break;

    case "polish_done":
      dispatch({
        type: "UPDATE_STEP",
        payload: { id: "polish", status: "completed", details: data },
      });
      break;

    case "qa_done":
      dispatch({
        type: "ADD_STEP",
        payload: { id: "qa", type: "qa", title: "QA agent", status: "completed", startedAt: Date.now(), endedAt: Date.now(), details: data },
      });
      break;

    case "docx_built":
      dispatch({
        type: "ADD_STEP",
        payload: { id: "docx", type: "docx", title: "Documento .docx generado", status: "completed", startedAt: Date.now(), endedAt: Date.now(), details: data },
      });
      break;

    case "audit_report":
      dispatch({ type: "AUDIT", payload: data });
      break;

    case "done":
      dispatch({ type: "DONE", payload: data });
      break;

    case "error":
      dispatch({ type: "ERROR", payload: `${data.stage}: ${data.message}` });
      break;

    case "agent_thought":
      // M18.d: live narration estilo Claude
      dispatch({
        type: "THOUGHT",
        payload: {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          kind: data.kind || "info",
          message: data.message || "",
          tool: data.tool || null,
          ref: data.ref || null,
          url: data.url || null,
          suggestion: data.suggestion || null,
          timestamp: Date.now(),
        },
      });
      break;
  }
}
