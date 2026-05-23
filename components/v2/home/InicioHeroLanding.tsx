'use client';

/**
 * components/v2/home/InicioHeroLanding.tsx
 *
 * Layout completo para /v2/inicio:
 *  - Estado vacio (messageCount === 0): hero composer-centric con saludo
 *    breve + composer al centro + chips de accion rapida abajo
 *    (estetica Apple/Claude/ChatGPT/Stitch).
 *  - Estado con mensajes (messageCount > 0): el composer toma toda la altura
 *    con thread+composer (su layout normal). Saludo y chips se desvanecen.
 *
 * IMPORTANTE: el ComposerV2WithStream se renderiza siempre en la MISMA
 * posicion del arbol para preservar la identidad del componente entre
 * estados — esto evita perder el stream SSE en vuelo durante la transicion
 * de "primer mensaje enviado". Solo cambian las clases del wrapper.
 */

import { Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ComposerV2WithStream } from '@/components/v2/composer/ComposerV2WithStream';
import { QuickActionChip } from './QuickActionChip';
import { QUICK_ACTIONS } from '@/lib/v2/quickActions';

export interface InicioHeroLandingProps {
  /** Saludo computado en cliente. Cadena vacia mientras hidrata. */
  greeting: string;
  /** Primer nombre del usuario para personalizar. */
  firstName: string;
  /** Prompt prefilled controlado por el padre. */
  prefillPrompt: string;
  /** Key para forzar re-sync cuando se pulsa un chip varias veces seguidas. */
  prefillKey: number;
  /** Callback al pulsar chip — el padre actualiza prefillPrompt + prefillKey. */
  onChipSelect: (prompt: string) => void;
  /** Notifica al padre el numero de mensajes (para alternar hero/chat). */
  onMessagesChange?: (count: number) => void;
  /** True cuando messageCount === 0 — controla visibilidad de saludo+chips. */
  showHero: boolean;
}

export function InicioHeroLanding({
  greeting,
  firstName,
  prefillPrompt,
  prefillKey,
  onChipSelect,
  onMessagesChange,
  showHero,
}: InicioHeroLandingProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
      {/* Spacer top — empuja el bloque al centro en hero, colapsa a 0 en chat */}
      {showHero && <div className="flex-1" aria-hidden />}

      <AnimatePresence initial={false}>
        {showHero && (
          <motion.h1
            key="hero-saludo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={transition}
            className="mx-auto flex items-center justify-center gap-2 px-6 pb-5 text-center"
            suppressHydrationWarning
            style={{
              fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 300,
              color: 'var(--v2-text-primary, #1A1916)',
              letterSpacing: '-0.01em',
            }}
          >
            <Sparkles
              size={18}
              strokeWidth={1.5}
              aria-hidden
              style={{ color: 'var(--v2-accent-copper, #B8763C)' }}
            />
            <span>{greeting ? `${greeting}, ${firstName}` : ' '}</span>
          </motion.h1>
        )}
      </AnimatePresence>

      {/*
       * Composer — SIEMPRE en esta posicion del arbol. Solo cambia el wrapper.
       *  - Hero: max-w-[680px] centrado, sin altura definida (compactWhenEmpty
       *    deja el composer en su tamaño natural).
       *  - Chat: flex-1 min-h-0 full height para que ComposerV2WithStream haga
       *    su layout interno de thread+sticky-composer.
       */}
      <div
        className={
          showHero
            ? 'mx-auto w-full max-w-[680px] px-6'
            : 'flex flex-1 min-h-0 flex-col'
        }
      >
        <ComposerV2WithStream
          key={prefillKey}
          placeholder="Pregúntele algo a LexAI o use /skill..."
          autoFocus={showHero}
          initialPrompt={prefillPrompt}
          onMessagesChange={onMessagesChange}
          compactWhenEmpty
        />
      </div>

      <AnimatePresence initial={false}>
        {showHero && (
          <motion.div
            key="hero-chips"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={transition}
            role="group"
            aria-label="Acciones rápidas"
            className="mx-auto flex w-full max-w-[680px] flex-wrap items-center justify-center gap-2 px-6 pt-5"
          >
            {QUICK_ACTIONS.map((action) => (
              <QuickActionChip
                key={action.id}
                icon={action.icon}
                label={action.label}
                prompt={action.prompt}
                onSelect={onChipSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer bottom — equilibra el centrado vertical en hero */}
      {showHero && <div className="flex-1" aria-hidden />}
    </div>
  );
}
