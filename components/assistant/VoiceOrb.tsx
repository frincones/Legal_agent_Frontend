'use client';

/**
 * VoiceOrb — animated indicator for the voice agent state.
 *
 * Reads `voice-store` (existing VoiceProvider state machine) to render
 * one of 5 visual states: idle / listening / thinking / speaking /
 * awaiting. The animation uses the Tailwind keyframes already defined
 * in tailwind.config.ts (hud-pulse, hud-breathe) · no new CSS needed.
 *
 * Three rendering sizes:
 *   - 'sm' (24px) · rail indicator
 *   - 'md' (56px) · header indicator inside expanded sidebar
 *   - 'lg' (120px) · floating mobile orb (Sprint 3 responsive)
 */

import { useVoiceStore } from '@/lib/stores/voice-store';

interface VoiceOrbProps {
  size?: 'sm' | 'md' | 'lg';
  /** Optional click handler to toggle the voice session. */
  onClick?: () => void;
  /** Aria label · default derived from state. */
  label?: string;
}

const SIZE_PX: Record<NonNullable<VoiceOrbProps['size']>, number> = {
  sm: 24,
  md: 56,
  lg: 120,
};

export function VoiceOrb({ size = 'md', onClick, label }: VoiceOrbProps) {
  const state = useVoiceStore((s) => s.state);
  const px = SIZE_PX[size];

  // Map voice-store state → palette + animation.
  const styles = (() => {
    switch (state) {
      case 'listening':
        return {
          bg: 'bg-ok',
          ring: 'ring-ok/30',
          anim: 'animate-hud-pulse',
          glyph: '◉',
          ariaLabel: 'Escuchando',
        };
      case 'thinking':
        return {
          bg: 'bg-purple',
          ring: 'ring-purple/30',
          anim: 'animate-hud-breathe',
          glyph: '◆',
          ariaLabel: 'Pensando',
        };
      case 'tool':
        return {
          bg: 'bg-warn',
          ring: 'ring-warn/30',
          anim: 'animate-hud-pulse',
          glyph: '⚙',
          ariaLabel: 'Ejecutando acción',
        };
      case 'speaking':
        return {
          bg: 'bg-accent',
          ring: 'ring-accent/30',
          anim: 'animate-hud-breathe',
          glyph: '◖',
          ariaLabel: 'Hablando',
        };
      case 'awaiting':
        return {
          bg: 'bg-warn',
          ring: 'ring-warn/30',
          anim: '',
          glyph: '?',
          ariaLabel: 'Esperando confirmación',
        };
      default:
        return {
          bg: 'bg-accent/70',
          ring: 'ring-accent/20',
          anim: '',
          glyph: '◌',
          ariaLabel: 'Lex (inactivo · clic para hablar)',
        };
    }
  })();

  const ariaLabel = label ?? styles.ariaLabel;

  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{ width: px, height: px }}
      className={[
        'relative shrink-0 rounded-full',
        styles.bg,
        styles.anim,
        'ring-4',
        styles.ring,
        onClick ? 'cursor-pointer transition-transform hover:scale-105 active:scale-95' : '',
        'flex items-center justify-center text-bg shadow-hud',
      ].join(' ')}
    >
      <span
        className={size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-2xl' : 'text-5xl'}
        aria-hidden
      >
        {styles.glyph}
      </span>
    </Comp>
  );
}
