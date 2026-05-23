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
 * REGLAS CLAVE:
 *  1. El composer SIEMPRE arranca limpio en /v2/inicio (freshStart=true).
 *     Si el usuario quiere recuperar un hilo previo, debe abrirlo desde
 *     "Mis hilos" en el sidebar.
 *  2. El ComposerV2WithStream se renderiza siempre en la MISMA posicion
 *     del arbol para preservar identidad y stream SSE durante hero→chat.
 *  3. Transicion hero→chat: motion.div con `layout` prop hace FLIP automatico
 *     cuando cambia el tamano/posicion del wrapper. Saludo+chips fade-out.
 */

import { Sparkles } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
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

  const fadeTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  const layoutTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <LayoutGroup id="inicio-hero">
      <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
        {/* Spacer top — empuja el bloque al centro en hero, colapsa a 0 en chat */}
        {showHero && (
          <motion.div
            key="spacer-top"
            initial={false}
            animate={{ flex: 1 }}
            exit={{ flex: 0 }}
            aria-hidden
          />
        )}

        {/* Saludo: fade-out + slide-up al pasar a chat */}
        <AnimatePresence initial={false}>
          {showHero && (
            <motion.h1
              key="hero-saludo"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={fadeTransition}
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
         * Composer — SIEMPRE en esta posicion del arbol. layoutId + layout prop
         * hacen FLIP animation automatico cuando cambia el wrapper.
         *  - Hero: max-w-[680px] centrado, sin altura definida.
         *  - Chat: flex-1 min-h-0 full height (layout normal del composer).
         */}
        <motion.div
          layout
          transition={layoutTransition}
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
            freshStart
          />
        </motion.div>

        {/* Chips: fade-out al pasar a chat */}
        <AnimatePresence initial={false}>
          {showHero && (
            <motion.div
              key="hero-chips"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={fadeTransition}
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
        {showHero && (
          <motion.div
            key="spacer-bottom"
            initial={false}
            animate={{ flex: 1 }}
            exit={{ flex: 0 }}
            aria-hidden
          />
        )}
      </div>
    </LayoutGroup>
  );
}
