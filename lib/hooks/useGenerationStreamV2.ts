"use client";

import { useCallback, useReducer, useRef } from "react";
import type {
  AgentThought,
  Block,
  GenerationState,
  LegalClassificationData,
  MetaPayload,
  MissingDataReport,
  QualityReport,
  RiskAdvisory,
  SectionPlanItem,
  SSEEventName,
  StructureRecipeData,
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
  | { type: "THOUGHT"; payload: AgentThought }
  // M19.16.F4 — reemplazo completo del array de bloques tras edits Harvey-style
  | { type: "REPLACE_BLOCKS"; payload: Block[] }
  // M19.17.D — flag de sincronización en vuelo (start/end)
  | { type: "SYNC_START" }
  | { type: "SYNC_END" }
  // M19.20 — quality report
  | { type: "QUALITY_REPORT"; payload: QualityReport }
  // M19.23 — Structure Discovery + Data Completeness
  | { type: "STRUCTURE_DISCOVERED"; payload: StructureRecipeData }
  | { type: "MISSING_DATA"; payload: MissingDataReport }
  | { type: "MISSING_DATA_RESOLVED" }
  // M19.24 — Legal Classifier + Risk Advisory
  | { type: "LEGAL_CLASSIFICATION"; payload: LegalClassificationData }
  | { type: "RISK_ADVISORY"; payload: RiskAdvisory }
  // M20.14 — Identifica qué orchestrator procesó la generación (lean | legacy)
  | { type: "SET_ORCHESTRATOR_KIND"; payload: string };

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
  lastEditAt: null,
  isSyncing: false,
  qualityReport: null,
  structureRecipe: null,
  missingDataReport: null,
  legalClassification: null,
  riskAdvisories: [],
  orchestratorKind: null,
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

    case "REPLACE_BLOCKS": {
      const newMap = new Map<string, Block>();
      for (const b of action.payload) newMap.set(b.block_id, b);
      return {
        ...state,
        blocks: action.payload,
        blocksByOrder: newMap,
        lastEditAt: Date.now(),
      };
    }

    case "SYNC_START":
      return { ...state, isSyncing: true };

    case "SYNC_END":
      return { ...state, isSyncing: false };

    case "QUALITY_REPORT":
      return { ...state, qualityReport: action.payload };

    case "STRUCTURE_DISCOVERED":
      return { ...state, structureRecipe: action.payload };

    case "MISSING_DATA":
      return { ...state, missingDataReport: action.payload };

    case "MISSING_DATA_RESOLVED":
      return { ...state, missingDataReport: null };

    case "LEGAL_CLASSIFICATION":
      return { ...state, legalClassification: action.payload };

    case "RISK_ADVISORY":
      return { ...state, riskAdvisories: [...state.riskAdvisories, action.payload] };

    case "SET_ORCHESTRATOR_KIND":
      return { ...state, orchestratorKind: action.payload };

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
    // M19.23.C — modo del data_completeness_gate
    // true (default): borrador, continúa con placeholders
    // false: firma, agente alerta si faltan datos críticos
    borrador_mode?: boolean;
  }) => Promise<void>;
  reset: () => void;
  abort: () => void;
  // M19.16.F4 — recargar bloques desde BD (tras edits inline / chat actions)
  refreshBlocks: (documentId: string) => Promise<void>;
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
      borrador_mode?: boolean;
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

        // M20.14: capturar el header X-Orchestrator (lean | legacy)
        // El backend lo setea para que el frontend pueda mostrar al usuario
        // qué arquitectura procesó esta generación.
        const orchestratorKind = res.headers.get("x-orchestrator");
        if (orchestratorKind) {
          dispatch({ type: "SET_ORCHESTRATOR_KIND", payload: orchestratorKind });
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

  // M19.16.F4 + M19.17.D — refresca bloques desde el endpoint GET /blocks
  const refreshBlocks = useCallback(async (documentId: string) => {
    dispatch({ type: "SYNC_START" });
    try {
      const res = await fetch(
        `/api/documents/v2/documents/${encodeURIComponent(documentId)}/blocks`
      );
      if (!res.ok) return;
      const data = await res.json();
      const rows: Array<{ block_id: string; block_type: string; block_data: any }> =
        data?.blocks || [];
      const blocks: Block[] = rows.map((r) => ({
        block_id: r.block_id,
        ...(r.block_data || {}),
      })) as Block[];
      dispatch({ type: "REPLACE_BLOCKS", payload: blocks });
    } catch {
      /* silent */
    } finally {
      dispatch({ type: "SYNC_END" });
    }
  }, []);

  return { state, generate, reset, abort, refreshBlocks };
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

    // M19.20 — Quality Loop Continuo
    case "quality_report":
      dispatch({ type: "QUALITY_REPORT", payload: data as QualityReport });
      break;

    case "completeness_check_done":
    case "coherence_check_done":
    case "autoloop_iteration":
      // por ahora solo log; el report final viene en "quality_report"
      break;

    // M19.22 — Context Enrichment (pre-research). El narrator emite el reporte
    // visible en la prosa del agente; aquí solo aceptamos los eventos sin acción.
    case "context_enrichment_started":
    case "context_enrichment_done":
      break;

    // M19.23 — Structure Discovery + Data Completeness
    case "structure_discovered":
      dispatch({ type: "STRUCTURE_DISCOVERED", payload: data as StructureRecipeData });
      break;

    case "missing_data":
      dispatch({ type: "MISSING_DATA", payload: data as MissingDataReport });
      break;

    case "missing_data_resolved":
      dispatch({ type: "MISSING_DATA_RESOLVED" });
      break;

    // M19.24 — Legal Classifier + Risk Advisory
    case "legal_classification":
      dispatch({ type: "LEGAL_CLASSIFICATION", payload: data as LegalClassificationData });
      break;

    case "risk_advisory":
      dispatch({ type: "RISK_ADVISORY", payload: data as RiskAdvisory });
      break;

    case "done":
      dispatch({ type: "DONE", payload: data });
      break;

    case "error":
      dispatch({ type: "ERROR", payload: `${data.stage}: ${data.message}` });
      break;

    case "agent_thought":
      // M18.d + M19.5: live narration estilo Claude
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
          // M19.5 fields
          toolId: data.tool_id || null,
          toolRequest: data.tool_request ?? undefined,
          toolResponse: data.tool_response ?? undefined,
          toolError: data.tool_error || null,
          toolDurationMs: data.tool_duration_ms ?? null,
          threadId: data.thread_id || null,
        },
      });
      break;

    case "presented_file":
      // M19.7: archivo final (DOCX) - empaquetar como thought presented_file
      dispatch({
        type: "THOUGHT",
        payload: {
          id: `pf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          kind: "presented_file",
          message: data.name || "documento.docx",
          tool: "presented_file",
          url: data.url || null,
          suggestion: null,
          ref: null,
          timestamp: Date.now(),
          toolId: `pf-${Date.now()}`,
          toolRequest: undefined,
          toolResponse: {
            name: data.name,
            url: data.url,
            size_kb: data.size_kb,
            mime: data.mime,
            preview_b64: data.preview_b64,
          },
          toolError: null,
          toolDurationMs: null,
          threadId: data.thread_id || null,
        },
      });
      break;
  }
}
