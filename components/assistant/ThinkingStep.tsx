'use client';

/**
 * ThinkingStep — collapsed "lo que hice antes de responder" header above
 * each assistant message. Matches the Claude Cowork pattern: a single
 * grey line with chevron that expands to show the reasoning trace.
 *
 * Source of the label:
 *  - Skill `meta` SSE event (skill name)
 *  - Tool calls observed during streaming (collected by AssistantSidebar)
 *  - Document/matter context attached at send time
 *
 * The label is intentionally past-tense and short ("Buscó jurisprudencia",
 * "Leyó documento del canvas", "Calculó intereses"). The expanded body
 * shows the structured trace (tool list, sources, etc.).
 */

import { useState } from 'react';

export interface ThinkingTrace {
  label: string;                    // headline shown collapsed
  toolsUsed?: string[];             // tool names invoked
  contextAttached?: string[];       // e.g. ["Documento del canvas (4.1 KB)", "Caso #79b15f79"]
  sources?: { ref: string; url?: string }[];
}

interface ThinkingStepProps {
  trace: ThinkingTrace;
  defaultOpen?: boolean;
}

export function ThinkingStep({ trace, defaultOpen = false }: ThinkingStepProps) {
  const [open, setOpen] = useState(defaultOpen);
  const hasDetail =
    (trace.toolsUsed?.length ?? 0) > 0 ||
    (trace.contextAttached?.length ?? 0) > 0 ||
    (trace.sources?.length ?? 0) > 0;

  return (
    <div className="text-ink-3 flex flex-col gap-1 text-[11px]">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        disabled={!hasDetail}
        className={[
          'flex items-center gap-1 text-left transition-colors',
          hasDetail ? 'hover:text-ink-2 cursor-pointer' : 'cursor-default',
        ].join(' ')}
        aria-expanded={open}
      >
        {hasDetail && (
          <span
            aria-hidden
            className={[
              'inline-block text-[10px] transition-transform',
              open ? 'rotate-90' : '',
            ].join(' ')}
          >
            ▸
          </span>
        )}
        <span className="italic">{trace.label}</span>
      </button>

      {open && hasDetail && (
        <div className="border-line ml-2.5 mt-0.5 flex flex-col gap-1.5 border-l pl-2.5">
          {trace.contextAttached && trace.contextAttached.length > 0 && (
            <div>
              <div className="text-ink-3 mb-0.5 text-[10px] uppercase tracking-wide">
                Contexto
              </div>
              <ul className="text-ink-2 space-y-0.5">
                {trace.contextAttached.map((c, i) => (
                  <li key={i}>· {c}</li>
                ))}
              </ul>
            </div>
          )}
          {trace.toolsUsed && trace.toolsUsed.length > 0 && (
            <div>
              <div className="text-ink-3 mb-0.5 text-[10px] uppercase tracking-wide">
                Herramientas
              </div>
              <ul className="text-ink-2 flex flex-wrap gap-1">
                {trace.toolsUsed.map((t, i) => (
                  <li
                    key={i}
                    className="bg-bg-sunken border-line text-ink-2 rounded-sm border px-1.5 py-0.5 font-mono text-[10px]"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {trace.sources && trace.sources.length > 0 && (
            <div>
              <div className="text-ink-3 mb-0.5 text-[10px] uppercase tracking-wide">
                Fuentes
              </div>
              <ul className="space-y-0.5">
                {trace.sources.map((s, i) => (
                  <li key={i}>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        {s.ref}
                      </a>
                    ) : (
                      <span className="text-ink-2">{s.ref}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
