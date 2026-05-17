'use client';

/**
 * ActivityTimeline — what the agent has done recently.
 *
 * Per U2: secondary tab inside the expanded sidebar, collapsed by default.
 * Renders the activityLog state from the assistant-store. In Sprint 4 this
 * also hydrates from the backend (skill_executions + agent_traces +
 * template_generations) so the user sees full history across sessions.
 */

import { useState } from 'react';
import { useAssistantStore } from '@/lib/stores/assistant-store';
import type { ActivityItem } from '@/lib/assistant/types';

interface ActivityTimelineProps {
  /** Initial open/closed state (defaults to collapsed). */
  defaultOpen?: boolean;
  /** Max items to display before "Ver más". */
  initialLimit?: number;
}

const KIND_GLYPH: Record<ActivityItem['kind'], string> = {
  message_sent: '💬',
  tool_called: '🛠',
  document_generated: '📄',
  citation_verified: '✓',
  context_loaded: '🎯',
  hitl_decided: '🚦',
};

export function ActivityTimeline({
  defaultOpen = false,
  initialLimit = 5,
}: ActivityTimelineProps) {
  const log = useAssistantStore((s) => s.activityLog);
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);

  const items = showAll ? log : log.slice(0, initialLimit);

  return (
    <section
      className="border-line border-t"
      aria-label="Actividad reciente del agente"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-ink-2 hover:bg-bg-elev flex w-full items-center justify-between px-3 py-2 text-xs"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <span aria-hidden>📜</span>
          <span>Actividad reciente</span>
          {log.length > 0 && (
            <span className="bg-bg-sunken text-ink-3 rounded-sm px-1.5 py-0.5 text-[10px]">
              {log.length}
            </span>
          )}
        </span>
        <span aria-hidden className="text-ink-3">
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div className="bg-bg-sunken/40 px-3 py-2">
          {log.length === 0 ? (
            <div className="text-ink-3 py-2 text-center text-xs italic">
              Sin actividad reciente.
            </div>
          ) : (
            <ol className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span
                    aria-hidden
                    className="text-ink-2 mt-0.5 shrink-0 text-sm leading-none"
                  >
                    {KIND_GLYPH[item.kind] ?? '·'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-ink text-xs leading-tight">
                      {item.label}
                    </div>
                    <div className="text-ink-3 mt-0.5 text-[10px]">
                      {formatTs(item.ts)}
                    </div>
                  </div>
                </li>
              ))}
              {!showAll && log.length > initialLimit && (
                <li>
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="text-accent hover:underline text-[11px]"
                  >
                    Ver {log.length - initialLimit} más
                  </button>
                </li>
              )}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

function formatTs(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
