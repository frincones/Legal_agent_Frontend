'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { useVoiceStore } from '@/lib/stores/voice-store';
import { TranscriptDrawer } from '@/components/voice/TranscriptDrawer';
import { cn } from '@/lib/utils';

/** Kebab (…) menu next to the VoiceHUD spacebar hint.
 *
 *  Diseño v2: sólo expone acciones que NO existen en otros lados de la
 *  app. Removidos los duplicados (Mostrar comandos ⌘K — ya existe el
 *  atajo y la barra del sidebar) y el ítem decorativo "Tools en sesión (0)".
 *
 *  Nuevos: Pausar / Modo silencioso / Ver transcripción.
 */
export function VoiceMenu() {
  const router = useRouter();
  const reset = useVoiceStore((s) => s.reset);
  const tools = useVoiceStore((s) => s.tools);
  const paused = useVoiceStore((s) => s.paused);
  const setPaused = useVoiceStore((s) => s.setPaused);
  const silentMode = useVoiceStore((s) => s.silentMode);
  const setSilentMode = useVoiceStore((s) => s.setSilentMode);

  const [open, setOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const onLimpiar = () => {
    reset();
    toast('Conversación limpia');
    close();
  };

  const onTogglePausa = () => {
    const next = !paused;
    setPaused(next);
    toast(next ? 'Agente pausado' : 'Agente reanudado', {
      description: next ? 'Espacio queda inactivo hasta reanudar' : undefined,
    });
    close();
  };

  const onToggleSilent = () => {
    const next = !silentMode;
    setSilentMode(next);
    toast(next ? 'Modo silencioso activo' : 'Modo silencioso desactivado', {
      description: next ? 'LexAI no hablará por audio. La transcripción sigue visible.' : undefined,
    });
    close();
  };

  const onOpenTranscript = () => {
    setTranscriptOpen(true);
    close();
  };

  const onConfig = () => {
    router.push('/settings/despacho');
    close();
  };

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="btn btn-icon btn-ghost btn-sm"
          title="Más opciones"
          aria-label="Más opciones"
          aria-expanded={open}
        >
          {Ic.dots}
        </button>
        {open && (
          <div
            role="menu"
            className="absolute bottom-full right-0 mb-2 w-[260px] overflow-hidden rounded-lg border border-line bg-bg-elev shadow-3"
          >
            <MenuItem
              icon={paused ? Ic.bolt : Ic.mic}
              label={paused ? 'Reanudar agente' : 'Pausar agente'}
              hint={paused ? 'Espacio reactiva el push-to-talk' : 'Espacio queda inactivo'}
              tone={paused ? 'accent' : undefined}
              onClick={onTogglePausa}
            />
            <MenuItem
              icon={silentMode ? Ic.warn : Ic.check}
              label={silentMode ? 'Salir de modo silencioso' : 'Modo silencioso'}
              hint={silentMode ? 'LexAI volverá a hablar' : 'Sólo texto, sin voz'}
              tone={silentMode ? 'accent' : undefined}
              onClick={onToggleSilent}
            />
            <MenuItem
              icon={Ic.doc}
              label="Ver transcripción"
              hint="Historial completo de esta sesión"
              onClick={onOpenTranscript}
            />
            <Divider />
            {tools.length > 0 && (
              <>
                <MenuItem
                  icon={Ic.bolt}
                  label={`Tools en sesión · ${tools.length}`}
                  hint={showTools ? 'Click para ocultar' : 'Click para ver últimas'}
                  onClick={() => setShowTools((s) => !s)}
                />
                {showTools && (
                  <ul className="flex flex-col gap-1 px-3 pb-2">
                    {tools.slice(-5).reverse().map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-2 rounded-md bg-bg-sunken px-2 py-1 text-[11.5px]"
                      >
                        <span
                          className={cn(
                            'h-[6px] w-[6px] rounded-full flex-none',
                            t.status === 'finished' ? 'bg-ok'
                              : t.status === 'error' ? 'bg-danger'
                                : 'bg-warn',
                          )}
                        />
                        <span className="mono truncate">{t.name}</span>
                        {typeof t.ms === 'number' && (
                          <span className="ml-auto text-ink-3">{t.ms}ms</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <Divider />
              </>
            )}
            <MenuItem
              icon={Ic.x}
              label="Limpiar conversación"
              hint="Borra transcripción y tools"
              onClick={onLimpiar}
            />
            <MenuItem
              icon={Ic.setting}
              label="Configuración del despacho"
              hint="Miembros, audit log, voz"
              onClick={onConfig}
            />
          </div>
        )}
      </div>
      <TranscriptDrawer open={transcriptOpen} onClose={() => setTranscriptOpen(false)} />
    </>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  tone?: 'accent';
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-bg-sunken',
        tone === 'accent' && 'bg-accent-soft/40',
      )}
    >
      <span className={cn('mt-0.5 flex-none', tone === 'accent' ? 'text-accent' : 'text-ink-3')}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {hint && <span className="block text-[11px] muted">{hint}</span>}
      </span>
    </button>
  );
}

function Divider() {
  return <div className="border-t border-line" aria-hidden />;
}
