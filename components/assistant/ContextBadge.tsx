'use client';

/**
 * ContextBadge — visual indicator of WHERE the agent is operating right now.
 *
 * Shown in AssistantHeader (expanded) and as a tooltip on the rail orb.
 * Without this, the user loses sight of "is the agent on case 3245 or globally?".
 * That ambiguity is the #1 UX failure of context-aware agents per our research.
 */

import { useAssistantStore } from '@/lib/stores/assistant-store';
import { describeContext } from '@/lib/assistant/context-detector';

interface ContextBadgeProps {
  /** Compact = single line, no metadata. Used in the rail tooltip. */
  variant?: 'compact' | 'full';
}

const AREA_ICON: Record<string, string> = {
  matter: '🎯',
  matters_list: '🏛️',
  documents: '📄',
  inbox: '📥',
  calendar: '📅',
  settings: '⚙️',
  admin: '🛠️',
  home: '🏠',
  other: '✨',
};

export function ContextBadge({ variant = 'full' }: ContextBadgeProps) {
  const context = useAssistantStore((s) => s.context);

  if (!context) {
    return (
      <div className="text-ink-3 text-xs italic" aria-live="polite">
        Detectando contexto…
      </div>
    );
  }

  const icon = AREA_ICON[context.area] ?? '✨';
  const label = describeContext(context);

  if (variant === 'compact') {
    return (
      <span className="text-ink-2 text-xs">
        <span aria-hidden>{icon}</span> {label}
      </span>
    );
  }

  return (
    <div className="bg-bg-elev border-line flex flex-col gap-1 rounded-md border px-3 py-2">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-base leading-none">{icon}</span>
        <span className="text-ink text-sm font-medium">{label}</span>
      </div>
      {context.area === 'matter' && context.matterMeta && (
        <div className="text-ink-3 flex flex-wrap items-center gap-2 text-xs">
          {context.matterMeta.materia && (
            <span className="bg-accent-soft text-accent-ink rounded-sm px-1.5 py-0.5">
              {context.matterMeta.materia}
            </span>
          )}
          {context.matterMeta.status && (
            <span className="text-ink-3">·</span>
          )}
          {context.matterMeta.status && (
            <span>{context.matterMeta.status}</span>
          )}
          {context.matterMeta.proximaFecha && (
            <>
              <span className="text-ink-3">·</span>
              <span>📅 {context.matterMeta.proximaFecha}</span>
            </>
          )}
        </div>
      )}
      {context.area === 'matters_list' && (
        <div className="text-ink-3 text-xs">
          Sin caso abierto · acciones cross-firm disponibles
        </div>
      )}
    </div>
  );
}
