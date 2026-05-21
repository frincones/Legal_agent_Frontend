'use client';

/**
 * F2-T04 (apoyo) · LexAI UX v2 — InlineComposerV2
 *
 * Composer inline temporal para la home v2.
 * Recibe un prompt prefilled (desde los SuggestionChips) y permite al usuario
 * editarlo antes de enviar.
 *
 * TODO F3: reemplazar con ComposerV2 completo (botón "+", ModelSelector,
 * VoiceRecorder, AttachmentChips, streaming token-by-token).
 *
 * Envía el prompt a /api/skills/ask con body { input } para proxy a /v1/skills/execute.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { SendHorizonal, Mic } from 'lucide-react';
import { toast } from 'sonner';

export interface InlineComposerV2Handle {
  /** Escribe el prompt en el textarea y lo focaliza. */
  prefill(prompt: string): void;
}

interface InlineComposerV2Props {
  /** Placeholder contextual. */
  placeholder?: string;
}

const MAX_HEIGHT = 200;

export const InlineComposerV2 = forwardRef<
  InlineComposerV2Handle,
  InlineComposerV2Props
>(function InlineComposerV2({ placeholder = 'Pregúntele algo a LexAI…' }, ref) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Expone el método prefill al padre (la página)
  useImperativeHandle(ref, () => ({
    prefill(prompt: string) {
      setValue(prompt);
      // Esperar al siguiente tick para que el state actualice el textarea
      setTimeout(() => {
        taRef.current?.focus();
        taRef.current?.setSelectionRange(prompt.length, prompt.length);
      }, 0);
    },
  }));

  // Auto-resize
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      // Usa /api/skills/ask que proxy a /v1/skills/execute con skill='/ask'.
      // TODO F3: reemplazar con /api/v2/composer/stream que soporte attachments.
      const res = await fetch('/api/skills/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input: trimmed }),
      });
      if (res.ok) {
        setValue('');
        toast.success('Consulta enviada a LexAI');
      } else {
        const errBody = await res.json().catch(() => null);
        const msg =
          (errBody as Record<string, unknown> | null)?.error ??
          `Error ${res.status} al enviar la consulta`;
        toast.error(String(msg));
      }
    } catch {
      toast.error('Sin conexión. Intente de nuevo en un momento.');
    } finally {
      setSending(false);
    }
  }, [value, sending]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      className="rounded-xl p-1"
      style={{
        border: '2px solid var(--v2-border-default, #D4D2CA)',
        backgroundColor: 'var(--v2-bg-surface, #FFFFFF)',
        boxShadow: 'var(--v2-shadow-md, 0 4px 8px rgba(26,25,22,0.06))',
        transition: 'border-color 200ms ease',
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.borderColor = 'var(--v2-accent-copper, #B8763C)';
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.borderColor = 'var(--v2-border-default, #D4D2CA)';
      }}
    >
      <div className="flex items-end gap-2 px-3 py-2">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={sending}
          rows={1}
          aria-label="Mensaje a LexAI"
          className="min-h-[28px] flex-1 resize-none bg-transparent outline-none"
          style={{
            fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
            fontSize: 'var(--v2-text-body, 16px)',
            lineHeight: 'var(--v2-text-body-lh, 26px)',
            color: 'var(--v2-text-primary, #1A1916)',
          }}
        />

        {/* Botón micrófono — placeholder para F3 */}
        <button
          type="button"
          disabled={sending}
          aria-label="Activar voz (disponible próximamente)"
          title="Voz — disponible en Fase 3"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--v2-text-tertiary, #807E76)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'var(--v2-bg-subtle, #F2F1EC)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <Mic size={16} strokeWidth={1.75} aria-hidden />
        </button>

        {/* Botón enviar */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || sending}
          aria-label="Enviar mensaje"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            backgroundColor: value.trim() && !sending
              ? 'var(--v2-brand-navy, #0E2A5E)'
              : 'var(--v2-bg-muted, #E8E7E1)',
            color: value.trim() && !sending
              ? '#FFFFFF'
              : 'var(--v2-text-tertiary, #807E76)',
          }}
        >
          <SendHorizonal size={15} strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div
        className="px-4 pb-2 text-xs"
        style={{ color: 'var(--v2-text-tertiary, #807E76)', fontSize: '11px' }}
      >
        Enter para enviar · Shift+Enter salto de línea · ⌘K comandos
      </div>
    </div>
  );
});
