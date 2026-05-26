"use client";

import * as React from "react";
import type { AgentThought, AgentThoughtKind } from "@/lib/types/blocks";

/**
 * Sprint M18.d · Stream de pensamientos del agente (estilo Claude).
 *
 * Renderiza la narración en vivo del agente mientras procesa el documento:
 * - Verificación de citas con tools (Brave Search, BD interna, etc.)
 * - Sugerencias de corrección del JudgeAgent
 * - Notas legales detectadas
 * - Progreso de cada stage
 *
 * Auto-scroll al último pensamiento. Compacto pero visible.
 */
interface Props {
  thoughts: AgentThought[];
  status: "idle" | "running" | "completed" | "error";
  className?: string;
}

const KIND_META: Record<AgentThoughtKind, { icon: string; bg: string; text: string }> = {
  info:        { icon: "💭", bg: "bg-zinc-50",    text: "text-zinc-700" },
  tool_call:   { icon: "🔧", bg: "bg-blue-50",    text: "text-blue-700" },
  tool_result: { icon: "✓",  bg: "bg-emerald-50", text: "text-emerald-700" },
  correction:  { icon: "💡", bg: "bg-amber-50",   text: "text-amber-800" },
  warning:     { icon: "⚖",  bg: "bg-amber-50",   text: "text-amber-700" },
  success:     { icon: "✅", bg: "bg-emerald-50", text: "text-emerald-700" },
  error:       { icon: "⚠",  bg: "bg-red-50",     text: "text-red-700" },
};

export function AgentThoughtStream({ thoughts, status, className = "" }: Props) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll al último pensamiento
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts.length]);

  if (thoughts.length === 0 && status !== "running") {
    return null;
  }

  return (
    <div className={`border border-zinc-200 rounded-md bg-white text-xs ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 bg-zinc-50/60">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧠</span>
          <span className="font-semibold text-zinc-700">Pensamiento del agente</span>
          {status === "running" && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              en vivo
            </span>
          )}
        </div>
        <span className="text-[10px] text-zinc-500">{thoughts.length} pasos</span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-96 overflow-y-auto p-2 space-y-1"
      >
        {thoughts.length === 0 && (
          <div className="text-zinc-400 text-center py-6 italic text-[11px]">
            Esperando primer pensamiento del agente…
          </div>
        )}
        {thoughts.map((t) => (
          <ThoughtRow key={t.id} thought={t} />
        ))}
        {status === "running" && (
          <div className="flex items-center gap-2 py-1 text-zinc-400 text-[11px] italic animate-pulse">
            <span>...</span>
            <span>procesando</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ThoughtRow({ thought }: { thought: AgentThought }) {
  const meta = KIND_META[thought.kind] || KIND_META.info;
  const time = new Date(thought.timestamp).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <div className={`flex gap-2 px-2 py-1 rounded ${meta.bg} ${meta.text}`}>
      <span className="text-sm leading-tight" aria-hidden>
        {meta.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="flex-1 min-w-0 leading-snug">{renderMessage(thought.message)}</span>
          <span className="text-[9px] opacity-50 font-mono shrink-0">{time}</span>
        </div>
        {thought.url && (
          <a
            href={thought.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-600 hover:underline mt-0.5 inline-block truncate max-w-full"
            title={thought.url}
          >
            ↗ {thought.url.slice(0, 80)}
          </a>
        )}
        {thought.suggestion && (
          <div className="text-[10px] mt-0.5 italic">
            ↳ Usar en su lugar: <code className="font-semibold">{thought.suggestion}</code>
          </div>
        )}
      </div>
    </div>
  );
}

/** Render simple markdown bold (**texto**) en el mensaje */
function renderMessage(msg: string): React.ReactNode {
  const parts = msg.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}
