"use client";

/**
 * Sprint M7 · Canvas integrado v2
 *
 * Split layout 38%/62%:
 *   Izquierda: ChatPanel — thread + composer para diálogo sobre el documento
 *              (puede pedir "regenera tal sección" → llama regenerate-section endpoint).
 *   Derecha:   Tabs [📄 Canvas | 🕒 Timeline | ⚖ Audit]
 *
 * Detrás de NEXT_PUBLIC_DOC_GEN_V2_ENABLED. Se monta cuando
 * /v2/canvas/draft?engine=v2&intent=...&template=... está en URL.
 *
 * Reutiliza:
 *   - useGenerationStreamV2 (Sprint M1)
 *   - ForensicCanvas (Sprint M1)
 *   - GenerationTimeline (Sprint M1)
 *   - AuditPanel (Sprint M4)
 *
 * Sin tocar:
 *   - ThreadCanvasSplit (legacy)
 *   - CanvasV2 (TipTap legacy)
 *   - ComposerV2WithStream (mantiene el flow original cuando engine!=v2)
 */

import * as React from "react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { useGenerationStreamV2 } from "@/lib/hooks/useGenerationStreamV2";
import { ForensicCanvas } from "./ForensicCanvas";
import { GenerationTimeline } from "./GenerationTimeline";
import { AuditPanel } from "./AuditPanel";

const LS_KEY = "lexai-v2-integrated-split";
const DEFAULT_LEFT = 38;
const DEFAULT_RIGHT = 62;
const MIN_SIZE = 25;

interface Props {
  intent: string;
  templateId?: string | null;
  brief?: string | null;
  matterId?: string | null;
}

type RightTab = "canvas" | "timeline" | "audit";

interface ChatMsg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
}

export function IntegratedGenerationCanvas({ intent, templateId, brief, matterId }: Props) {
  const { state, generate, reset, abort } = useGenerationStreamV2();

  const [defaultLeft, setDefaultLeft] = React.useState<number>(DEFAULT_LEFT);
  const [rightTab, setRightTab] = React.useState<RightTab>("canvas");
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [regenLoading, setRegenLoading] = React.useState(false);
  const startedRef = React.useRef(false);

  // Restore split ratio
  React.useEffect(() => {
    try {
      const v = localStorage.getItem(LS_KEY);
      if (v) {
        const n = parseInt(v, 10);
        if (!isNaN(n) && n >= MIN_SIZE && n <= 100 - MIN_SIZE) setDefaultLeft(n);
      }
    } catch {}
  }, []);

  // Trigger generación automática al montar con intent
  React.useEffect(() => {
    if (startedRef.current || !intent) return;
    startedRef.current = true;
    setMessages([
      {
        id: `u-${Date.now()}`,
        role: "user",
        content: intent,
        ts: Date.now(),
      },
      {
        id: `s-${Date.now()}`,
        role: "system",
        content: "Iniciando generación con motor v2…",
        ts: Date.now(),
      },
    ]);
    generate({
      intent,
      user_brief: brief || undefined,
      doc_type: templateId || undefined,
      matter_id: matterId || undefined,
    });
  }, [intent, brief, templateId, matterId, generate]);

  // Cuando generación completa, agregar mensaje al thread
  React.useEffect(() => {
    if (state.status === "completed") {
      setMessages((prev) => {
        if (prev.find((m) => m.id === "complete")) return prev;
        return [
          ...prev,
          {
            id: "complete",
            role: "assistant",
            content: `✓ Documento generado: ${state.blocks.length} bloques en ${
              state.finishedAt && state.startedAt
                ? ((state.finishedAt - state.startedAt) / 1000).toFixed(1)
                : "?"
            }s. Puedes pedir cambios o descargar el .docx desde el canvas.`,
            ts: Date.now(),
          },
        ];
      });
      setRightTab("canvas");
    }
    if (state.status === "error") {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "system",
          content: `Error: ${state.error || "desconocido"}`,
          ts: Date.now(),
        },
      ]);
    }
  }, [state.status, state.blocks.length, state.startedAt, state.finishedAt, state.error]);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const input = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: input, ts: Date.now() },
    ]);

    // Detectar si pide regenerar sección
    const sectionRegex = /regener[ae]r?\s+(?:la\s+secci[oó]n|secci[oó]n)\s+([a-záéíóúñ_]+)/i;
    const m = input.match(sectionRegex);
    if (m && m[1] && state.documentId) {
      const sectionKey = m[1].toLowerCase();
      await regenerateSection(sectionKey, input);
      return;
    }

    // Fallback: notificar al usuario que esta funcionalidad evoluciona
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: 'Aún no integro chat conversacional. Para regenerar una sección, escribe "regenera la sección hechos" o usa los botones del canvas. Próximo sprint añadiré diálogo libre con el documento.',
        ts: Date.now(),
      },
    ]);
  };

  const regenerateSection = async (sectionKey: string, feedback: string) => {
    if (!state.documentId) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "system",
          content: "No hay document_id activo todavía. Espera a que termine la generación inicial.",
          ts: Date.now(),
        },
      ]);
      return;
    }
    setRegenLoading(true);
    try {
      const res = await fetch(
        `/api/documents/v2/documents/${encodeURIComponent(state.documentId)}/regenerate-section`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section_key: sectionKey, feedback }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: `✓ Sección "${sectionKey}" marcada para regenerar (v${data.snapshot_version?.version_num ?? "?"}). Re-ejecutando…`,
            ts: Date.now(),
          },
        ]);
        // Trigger nueva generación que re-stream la sección borrada
        await generate({
          intent,
          user_brief: brief || undefined,
          doc_type: templateId || undefined,
          matter_id: matterId || undefined,
        });
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "system",
            content: `Error al regenerar: ${data.error || data.detail || "desconocido"}`,
            ts: Date.now(),
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "system",
          content: `Error de red: ${String(e)}`,
          ts: Date.now(),
        },
      ]);
    } finally {
      setRegenLoading(false);
    }
  };

  const handleLayout = React.useCallback((layout: Record<string, number>) => {
    const left = layout["chat"];
    if (typeof left === "number") {
      try {
        localStorage.setItem(LS_KEY, String(Math.round(left)));
      } catch {}
    }
  }, []);

  const downloadDocx = async () => {
    if (!state.documentId) return;
    window.open(
      `/api/documents/v2/documents/${encodeURIComponent(state.documentId)}/export-forensic`,
      "_blank"
    );
  };

  const isRunning = state.status === "running";

  return (
    <PanelGroup orientation="horizontal" onLayoutChanged={handleLayout} style={{ height: "100%", width: "100%" }}>
      {/* Panel izquierdo: Chat + Composer */}
      <Panel defaultSize={defaultLeft} minSize={MIN_SIZE} id="chat">
        <ChatPanel
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          onSend={sendChat}
          isRunning={isRunning}
          regenLoading={regenLoading}
          status={state.status}
        />
      </Panel>
      <PanelResizeHandle style={{ width: 4, cursor: "col-resize", backgroundColor: "var(--v2-border-default, #DDDBD3)", flexShrink: 0 }} />
      {/* Panel derecho: Tabs */}
      <Panel defaultSize={DEFAULT_RIGHT} minSize={MIN_SIZE} id="right">
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, backgroundColor: "white" }}>
          {/* Tab bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 0,
            borderBottom: "1px solid var(--v2-border-default, #DDDBD3)",
            backgroundColor: "var(--v2-bg-base, #FAFAF7)",
            flexShrink: 0, padding: "6px 12px",
          }}>
            <TabButton active={rightTab === "canvas"} onClick={() => setRightTab("canvas")} label="📄 Canvas" />
            <TabButton active={rightTab === "timeline"} onClick={() => setRightTab("timeline")}
              label={`🕒 Timeline${state.timeline.length ? ` (${state.timeline.filter(s => s.status === "completed").length}/${state.timeline.length})` : ""}`} />
            <TabButton active={rightTab === "audit"} onClick={() => setRightTab("audit")} label="⚖ Audit" disabled={state.status !== "completed"} />
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {state.status === "completed" && state.documentId && (
                <button onClick={downloadDocx} className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800">
                  📥 .docx
                </button>
              )}
              {isRunning && (
                <button onClick={abort} className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50">
                  Cancelar
                </button>
              )}
              {!isRunning && state.status !== "idle" && (
                <button
                  onClick={() => { reset(); startedRef.current = false; setMessages([]); }}
                  className="text-xs px-2 py-1 border border-zinc-300 rounded hover:bg-zinc-100"
                >
                  Nuevo
                </button>
              )}
            </div>
          </div>
          {/* Tab content */}
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            {rightTab === "canvas" && <ForensicCanvas blocks={state.blocks} status={state.status} />}
            {rightTab === "timeline" && (
              <GenerationTimeline
                steps={state.timeline}
                totalDurationMs={state.startedAt && state.finishedAt ? state.finishedAt - state.startedAt : (state.startedAt ? Date.now() - state.startedAt : undefined)}
                collapsed={false}
              />
            )}
            {rightTab === "audit" && (
              <div className="max-w-3xl mx-auto p-4">
                <AuditPanel audit={state.audit as any} />
              </div>
            )}
          </div>
        </div>
      </Panel>
    </PanelGroup>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TabButton({ active, onClick, label, disabled }: { active: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-3 py-1 rounded-t-md border-b-2 transition-colors ${
        active
          ? "border-zinc-900 text-zinc-900 font-medium bg-white"
          : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {label}
    </button>
  );
}

function ChatPanel({
  messages, chatInput, setChatInput, onSend, isRunning, regenLoading, status,
}: {
  messages: ChatMsg[];
  chatInput: string;
  setChatInput: (s: string) => void;
  onSend: () => void;
  isRunning: boolean;
  regenLoading: boolean;
  status: string;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", minHeight: 0,
      backgroundColor: "var(--v2-bg-base, #FAFAF7)",
      borderRight: "1px solid var(--v2-border-default, #DDDBD3)",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 12px",
        borderBottom: "1px solid var(--v2-border-default, #DDDBD3)",
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--v2-text-tertiary, #7A7870)" }}>
          Conversación
        </span>
        {isRunning && (
          <span className="text-[10px] text-emerald-700 animate-pulse">● generando…</span>
        )}
        {regenLoading && (
          <span className="text-[10px] text-amber-700 animate-pulse">● regenerando sección…</span>
        )}
        {status === "completed" && !regenLoading && (
          <span className="text-[10px] text-emerald-700">✓ completado</span>
        )}
      </div>
      {/* Thread */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px" }}>
        {messages.map((m) => (
          <MessageRow key={m.id} msg={m} />
        ))}
      </div>
      {/* Composer */}
      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid var(--v2-border-default, #DDDBD3)",
        backgroundColor: "white",
        flexShrink: 0,
      }}>
        <div className="flex gap-2">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={
              status === "completed"
                ? 'Ej: "regenera la sección hechos"'
                : "Espera a que termine la generación inicial…"
            }
            rows={2}
            disabled={isRunning || regenLoading}
            className="flex-1 text-sm border border-zinc-300 rounded px-2 py-1.5 resize-none disabled:opacity-50 disabled:bg-zinc-50"
          />
          <button
            onClick={onSend}
            disabled={!chatInput.trim() || isRunning || regenLoading}
            className="text-sm px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 mt-1">
          Enter para enviar · Shift+Enter nueva línea
        </p>
      </div>
    </div>
  );
}

function MessageRow({ msg }: { msg: ChatMsg }) {
  if (msg.role === "system") {
    return (
      <div className="my-2 text-[11px] italic text-zinc-500 text-center bg-zinc-100 rounded px-2 py-1">
        {msg.content}
      </div>
    );
  }
  const isUser = msg.role === "user";
  return (
    <div className={`my-2 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
        isUser
          ? "bg-zinc-900 text-white"
          : "bg-white border border-zinc-200 text-zinc-900"
      }`}>
        {msg.content}
      </div>
    </div>
  );
}
