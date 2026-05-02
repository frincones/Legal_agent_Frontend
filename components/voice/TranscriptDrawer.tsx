'use client';

import { useEffect } from 'react';
import { Ic } from '@/components/atoms/icons';
import { useVoiceStore } from '@/lib/stores/voice-store';
import { cn } from '@/lib/utils';

/** Drawer modal con la transcripción completa de la sesión.
 *  Lee history del voice-store. Cierra con Escape o click fuera. */
export function TranscriptDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const history = useVoiceStore((s) => s.history);
  const partial = useVoiceStore((s) => s.partialTranscript);
  const answerText = useVoiceStore((s) => s.answerText);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/40 transition-opacity"
      />
      <aside
        role="dialog"
        aria-label="Transcripción de la sesión"
        className="fixed inset-y-0 right-0 z-[110] flex w-[min(560px,95vw)] flex-col border-l border-line bg-bg shadow-3"
      >
        <header className="flex items-center gap-2 border-b border-line px-5 py-4">
          <h3 className="serif m-0 text-[16px] font-semibold">Transcripción</h3>
          <span className="text-[11.5px] muted">{history.length} turno{history.length !== 1 ? 's' : ''}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="btn btn-icon btn-ghost btn-sm ml-auto"
          >
            {Ic.x}
          </button>
        </header>

        <div className="flex-1 overflow-auto px-5 py-4">
          {history.length === 0 && !partial && !answerText ? (
            <div className="muted text-[12.5px]">
              Aún no hay turnos en esta sesión. Habla con LexAI o pulsa Espacio.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {history.map((t, i) => (
                <li
                  key={`${t.ts}-${i}`}
                  className={cn(
                    'rounded-md p-3 text-[13px] leading-relaxed',
                    t.role === 'user' ? 'bg-bg-sunken' : 'bg-accent-soft text-accent-ink',
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 text-[10.5px] uppercase tracking-wider muted">
                    <span>{t.role === 'user' ? 'Abogado' : 'LexAI'}</span>
                    <span className="ml-auto">{new Date(t.ts).toLocaleTimeString('es-CO')}</span>
                  </div>
                  <div className="whitespace-pre-wrap">{t.text}</div>
                </li>
              ))}
              {partial && (
                <li className="rounded-md border border-dashed border-line bg-bg-sunken p-3 text-[13px] italic muted">
                  <div className="mb-1 text-[10.5px] uppercase tracking-wider">Abogado · escuchando</div>
                  {partial}
                </li>
              )}
              {answerText && (
                <li className="rounded-md border border-dashed border-accent bg-accent-soft p-3 text-[13px] italic">
                  <div className="mb-1 text-[10.5px] uppercase tracking-wider muted">LexAI · respondiendo</div>
                  {answerText}
                </li>
              )}
            </ul>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-line px-5 py-3 text-[11.5px] muted">
          <span>Sólo visible para ti — no se sincroniza con otros usuarios</span>
        </footer>
      </aside>
    </>
  );
}
