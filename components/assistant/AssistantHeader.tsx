'use client';

/**
 * AssistantHeader — top bar of the expanded sidebar.
 *
 * Shows: VoiceOrb (mode indicator) + ContextBadge (where) + close button.
 * Per V8: voice and chat are unified — clicking the orb toggles voice
 * without losing the thread.
 */

import { useAssistantStore } from '@/lib/stores/assistant-store';
import { ContextBadge } from './ContextBadge';
import { VoiceOrb } from './VoiceOrb';

interface AssistantHeaderProps {
  /** Voice toggle handler · pass useVoice().toggle from parent. */
  onVoiceToggle?: () => void;
}

export function AssistantHeader({ onVoiceToggle }: AssistantHeaderProps) {
  const mode = useAssistantStore((s) => s.mode);
  const setExpanded = useAssistantStore((s) => s.setExpanded);

  return (
    <header className="border-line bg-bg flex flex-col gap-3 border-b px-3 pb-3 pt-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <VoiceOrb size="sm" onClick={onVoiceToggle} />
          <div className="flex flex-col leading-tight">
            <span className="text-ink text-sm font-medium">Lex · asistente</span>
            <span className="text-ink-3 text-[10px] uppercase tracking-wide">
              {mode === 'voice' && 'Escuchando'}
              {mode === 'chat' && 'Chat'}
              {mode === 'thinking' && 'Pensando…'}
              {mode === 'acting' && 'Ejecutando…'}
              {mode === 'awaiting' && 'Esperando confirmación'}
              {mode === 'idle' && 'Inactivo'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Colapsar asistente"
          className="text-ink-3 hover:text-ink hover:bg-bg-elev rounded-sm p-1 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <ContextBadge variant="full" />
    </header>
  );
}
