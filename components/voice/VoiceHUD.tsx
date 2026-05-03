'use client';

import { motion } from 'framer-motion';
import { Ic } from '@/components/atoms/icons';
import { useVoiceStore, type VoiceState } from '@/lib/stores/voice-store';
import { useVoice } from '@/components/voice/VoiceProvider';
import { VoiceMenu } from '@/components/voice/VoiceMenu';
import { cn } from '@/lib/utils';

const STATE_META: Record<VoiceState, { color: string; label: string; caption: string }> = {
  idle: {
    color: 'text-ink-3',
    label: 'Hola LexAI',
    caption: 'Di "Hola LexAI" o pulsa Espacio',
  },
  listening: {
    color: 'text-accent',
    label: 'Escuchando…',
    caption: '',
  },
  thinking: {
    color: 'text-warn',
    label: 'Razonando…',
    caption: 'gpt-4o · contexto del caso',
  },
  tool: {
    color: 'text-purple',
    label: 'Buscando jurisprudencia…',
    caption: 'research_jurisprudence → Corte Constitucional',
  },
  speaking: {
    color: 'text-ok',
    label: 'Respondiendo…',
    caption: '',
  },
  awaiting: {
    color: 'text-danger',
    label: 'Confirmar acción',
    caption: 'Aprobación humana requerida',
  },
};

export function VoiceHUD({ compact = false }: { compact?: boolean }) {
  const state = useVoiceStore((s) => s.state);
  const partial = useVoiceStore((s) => s.partialTranscript);
  const transcript = useVoiceStore((s) => s.transcript);
  const captionOverride = useVoiceStore((s) => s.caption);
  const paused = useVoiceStore((s) => s.paused);
  const meta = STATE_META[state];
  const showText = state === 'listening' ? partial : transcript || partial;
  const { toggle, micPermission, ready } = useVoice();
  const disabled = micPermission === 'unsupported' || micPermission === 'denied';

  // Estado on/off visual claro:
  //   'off'      = sin sesión (no conectado, esperando que toques)
  //   'paused'   = pausado por el usuario (menú …)
  //   'on'       = activo (idle/listening/thinking/etc.)
  const onOffState: 'off' | 'paused' | 'on' =
    paused ? 'paused' : ready ? 'on' : 'off';

  // Border color por estado on/off (no por VoiceState, eso es el orb)
  const borderClass =
    onOffState === 'on'      ? 'border-ok/60 shadow-[0_0_0_3px_rgb(var(--ok-soft-rgb))]'
    : onOffState === 'paused' ? 'border-warn/60'
    :                            'border-line';

  return (
    <motion.div
      role="status"
      aria-live="polite"
      data-state={state}
      data-onoff={onOffState}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={cn(
        'glass flex items-center gap-2 rounded-full border-2 shadow-hud transition-colors md:gap-3',
        borderClass,
        'h-[56px] max-w-[92vw] px-3 md:h-[64px] md:px-3',
        compact
          ? 'md:h-[52px] md:min-w-[360px]'
          : 'md:min-w-[520px] md:max-w-[720px]',
      )}
    >
      <button
        type="button"
        onClick={() => !disabled && void toggle()}
        disabled={disabled}
        aria-label={state === 'idle' ? 'Activar voz' : 'Detener voz'}
        title={
          micPermission === 'denied'
            ? 'Permiso de micrófono denegado'
            : micPermission === 'unsupported'
              ? 'Navegador no soporta voz'
              : 'Click o mantén Espacio para hablar'
        }
        className={cn(
          'rounded-full transition-transform',
          !disabled && 'cursor-pointer hover:scale-105',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <Orb state={state} compact={compact} />
      </button>
      {/* Pill de estado on/off — visualmente clara para que el abogado
          vea de un vistazo si el agente está activo o no. */}
      <span
        className={cn(
          'hidden flex-none items-center gap-1 rounded-full border px-2 py-[3px] text-[10px] font-semibold uppercase tracking-wider md:inline-flex',
          onOffState === 'on'      && 'border-ok/40 bg-ok-soft text-ok',
          onOffState === 'paused'  && 'border-warn/40 bg-warn-soft text-warn',
          onOffState === 'off'     && 'border-line bg-bg-sunken text-ink-3',
        )}
        title={
          onOffState === 'on'     ? 'Agente activo · usando tokens'
          : onOffState === 'paused' ? 'Agente pausado · sin consumir tokens'
          : 'Agente desconectado · pulsa Espacio para activar'
        }
      >
        <span
          className={cn(
            'h-[6px] w-[6px] rounded-full',
            onOffState === 'on'     && 'bg-ok animate-pulse',
            onOffState === 'paused' && 'bg-warn',
            onOffState === 'off'    && 'bg-ink-4',
          )}
        />
        {onOffState === 'on' ? 'Activo' : onOffState === 'paused' ? 'Pausado' : 'Off'}
      </span>

      <div className="flex min-w-0 flex-col gap-[1px] md:min-w-[110px]">
        <div className={cn('truncate text-[12.5px] font-semibold -tracking-[0.01em] md:text-[13px]', meta.color)}>
          {meta.label}
        </div>
        {(captionOverride || meta.caption) && (
          <div className="hidden text-[11.5px] leading-tight muted md:block">
            {captionOverride || meta.caption}
          </div>
        )}
      </div>
      {showText && (
        <div className="ml-auto hidden min-w-0 flex-1 truncate rounded-[12px] bg-bg-sunken px-[10px] py-[6px] text-[12.5px] text-ink-2 md:block">
          {showText}
        </div>
      )}
      <div className="hidden shrink-0 items-center gap-1.5 md:flex">
        <span className="kbd">␣</span>
        <VoiceMenu />
      </div>
    </motion.div>
  );
}

function Orb({ state, compact }: { state: VoiceState; compact: boolean }) {
  const ringSize = compact ? 36 : 44;
  const coreSize = compact ? 26 : 32;

  return (
    <div
      className="grid place-items-center rounded-full"
      style={{
        width: ringSize,
        height: ringSize,
        backgroundImage:
          state === 'idle'
            ? 'none'
            : `radial-gradient(circle at 50% 50%, color-mix(in oklab, currentColor 22%, transparent) 0%, transparent 70%)`,
      }}
    >
      <div
        className={cn(
          'relative grid place-items-center rounded-full',
          state === 'idle' && 'border-[1.5px] border-ink-4 bg-transparent animate-hud-breathe',
          state === 'listening' && 'bg-accent text-white animate-hud-pulse',
          state === 'thinking' && 'bg-warn text-white animate-hud-pulse',
          state === 'tool' && 'bg-purple text-white animate-hud-pulse',
          state === 'speaking' && 'bg-ok text-white animate-hud-pulse',
          state === 'awaiting' && 'bg-danger text-white animate-hud-pulse',
        )}
        style={{ width: coreSize, height: coreSize }}
      >
        {(state === 'listening' || state === 'speaking') && <Bars />}
        {(state === 'thinking' || state === 'tool') && <Spin />}
        {state === 'awaiting' && Ic.warn}
        {state === 'idle' && <span className="text-ink-3">{Ic.mic}</span>}
      </div>
    </div>
  );
}

function Bars() {
  return (
    <div className="flex items-center gap-[2.5px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="block w-[2.5px] rounded-[2px] bg-white"
          style={{
            height: 10,
            animation: `lex-wave 0.9s ease-in-out infinite`,
            animationDelay: `${i * 90}ms`,
          }}
        />
      ))}
      <style>{`@keyframes lex-wave { 0%,100% { height: 6px; } 50% { height: 18px; } }`}</style>
    </div>
  );
}

function Spin() {
  return (
    <span
      className="inline-block rounded-full border-2 border-white/35 border-t-white"
      style={{ width: 14, height: 14, animation: 'lex-rot 0.8s linear infinite' }}
    >
      <style>{`@keyframes lex-rot { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
