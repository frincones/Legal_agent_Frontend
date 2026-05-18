'use client';

/**
 * AssistantComposer — unified text + voice input (V8: one surface, no toggle).
 *
 * Sprint 1 scope (this file):
 *   ✓ Text input with auto-resize textarea
 *   ✓ Enter to send · Shift+Enter for newline
 *   ✓ Slash menu trigger (placeholder · wired in Sprint 2)
 *   ✓ Mic icon button (placeholder · wired in Sprint 3 via VoiceProvider)
 *
 * NOT yet (Sprint 2/3):
 *   ✗ Actual mic capture (RealtimeClient mounted inside sidebar later)
 *   ✗ Skill autocomplete after `/` (uses /api/skills which exists already)
 *   ✗ Network call to backend (will go through /skills/execute/stream)
 *
 * The component is intentionally dumb: it emits onSend with the typed text.
 * The parent (AssistantSidebar) decides how to route (chat skill vs voice).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAssistantStore } from '@/lib/stores/assistant-store';
import { useCanvasStore } from '@/lib/stores/canvas-store';

interface AssistantComposerProps {
  /** Fired when the user submits text. */
  onSend?: (text: string) => void;
  /** Fired when the user toggles voice (Sprint 3 implementation). */
  onVoiceToggle?: () => void;
  /** Disabled while the agent is responding. */
  disabled?: boolean;
}

const MAX_TEXTAREA_HEIGHT = 200;

export function AssistantComposer({
  onSend,
  onVoiceToggle,
  disabled,
}: AssistantComposerProps) {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const mode = useAssistantStore((s) => s.mode);
  const context = useAssistantStore((s) => s.context);
  // Subscribe to canvas markdown so the "doc attached" pill updates in
  // realtime as the user types in the editor or switches matter.
  const canvasMarkdown = useCanvasStore((s) => s.markdown);
  const canvasHasContent = canvasMarkdown && canvasMarkdown.trim().length > 50;
  const canvasSizeKB = canvasHasContent
    ? Math.round((canvasMarkdown.length / 1024) * 10) / 10
    : 0;

  // Auto-resize textarea up to MAX_TEXTAREA_HEIGHT.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend?.(trimmed);
    setValue('');
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleVoice = useCallback(() => {
    if (disabled) return;
    onVoiceToggle?.();
  }, [disabled, onVoiceToggle]);

  // Contextual placeholder — guides the user based on where they are.
  const placeholder =
    context?.area === 'matter'
      ? 'Pregúntale a Lex sobre este caso… (/ para skills)'
      : context?.area === 'matters_list'
      ? 'Busca casos, plazos, reportes… (/ para skills)'
      : 'Pregúntale algo a Lex… (/ para skills)';

  const voiceActive = mode === 'voice';

  return (
    <div className="border-line bg-bg flex flex-col gap-2 border-t p-3">
      {/* Context pill · shown when the canvas has substantive content the
          agent will receive as document_text on the next send. Lets the user
          KNOW the agent has the open document in scope. */}
      {canvasHasContent && (
        <div
          className="bg-accent-soft text-accent-ink flex items-center gap-1.5 self-start rounded-full px-2 py-0.5 text-[10px]"
          title="El asistente recibirá el contenido del canvas como contexto en tu próximo mensaje"
        >
          <span aria-hidden>📎</span>
          <span>Documento del canvas adjunto · {canvasSizeKB} KB</span>
        </div>
      )}
      <div className="border-line bg-bg-elev flex items-end gap-2 rounded-md border px-2 py-1.5 focus-within:border-accent/60 transition-colors">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={[
            'min-h-[24px] flex-1 resize-none bg-transparent text-sm',
            'text-ink placeholder:text-ink-3',
            'outline-none focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
          ].join(' ')}
          aria-label="Mensaje al asistente"
        />

        {/* Mic icon — Sprint 3 wires actual voice activation. */}
        <button
          type="button"
          onClick={handleVoice}
          disabled={disabled}
          aria-label={voiceActive ? 'Detener voz' : 'Hablar'}
          aria-pressed={voiceActive}
          className={[
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm',
            'transition-colors duration-200',
            voiceActive
              ? 'bg-ok text-bg'
              : 'text-ink-2 hover:bg-bg-sunken hover:text-ink',
            'disabled:cursor-not-allowed disabled:opacity-50',
          ].join(' ')}
        >
          {voiceActive ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden
            >
              <rect x="6" y="6" width="12" height="12" rx="1.5" />
            </svg>
          ) : (
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
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label="Enviar"
          className={[
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm',
            'transition-colors duration-200',
            value.trim() && !disabled
              ? 'bg-accent text-bg hover:opacity-90'
              : 'bg-bg-sunken text-ink-3 cursor-not-allowed',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
            aria-hidden
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <div className="text-ink-3 flex items-center justify-between gap-2 px-1 text-[11px]">
        <span>
          Enter para enviar · Shift+Enter salto de línea · ⌘K comandos
        </span>
        {voiceActive && (
          <span className="text-ok flex items-center gap-1">
            <span className="bg-ok inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
            Escuchando
          </span>
        )}
      </div>
    </div>
  );
}
