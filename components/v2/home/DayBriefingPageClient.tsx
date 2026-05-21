'use client';

/**
 * F2-T04 (apoyo) · LexAI UX v2 — DayBriefingPageClient
 *
 * Client island que:
 *  - Calcula el saludo (greeting) en el cliente para evitar hydration mismatch
 *    (React #425): el servidor no sabe la zona horaria del usuario, así que
 *    el greeting se inicializa vacío y se resuelve en useEffect.
 *  - Owna el state del prompt prefilled (SuggestionChips → composer).
 *  - Renderiza el layout scroll + sticky: thread scrollea, composer fijo abajo.
 *  - Muestra el header de saludo + fecha encima del thread (fuera del bubble).
 *  - Usa ComposerV2WithStream (F3) para streaming SSE token-by-token.
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { type DayBriefingData } from '@/lib/v2/dayBriefing';
import { DayBriefingThread } from './DayBriefingThread';
import { ComposerV2WithStream } from '@/components/v2/composer/ComposerV2WithStream';

interface DayBriefingPageClientProps {
  data: DayBriefingData;
}

/** Calcula el saludo según la hora local del cliente. */
function computeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Formatea la fecha en español Colombia usando la zona horaria del cliente. */
function formatDateES(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DayBriefingPageClient({ data }: DayBriefingPageClientProps) {
  /**
   * greeting y dateFormatted se inicializan como cadena vacía en el primer
   * render (SSR/SSG) y se rellenan en el cliente tras el primer mount.
   * Esto evita el React hydration mismatch #425 que surgía de comparar
   * hora UTC del servidor vs hora local del cliente.
   */
  const [greeting, setGreeting] = useState('');
  const [dateFormatted, setDateFormatted] = useState('');

  // Prompt prefilled desde los SuggestionChips — se pasa a ComposerV2WithStream
  const [prefillPrompt, setPrefillPrompt] = useState('');

  // Contador para forzar re-sync del initialPrompt cuando el chip se pulsa
  // dos veces con el mismo texto.
  const prefillCounterRef = useRef(0);
  const [prefillKey, setPrefillKey] = useState(0);

  useEffect(() => {
    setGreeting(computeGreeting());
    setDateFormatted(formatDateES());
  }, []);

  const handlePrompt = useCallback((prompt: string) => {
    prefillCounterRef.current += 1;
    setPrefillKey(prefillCounterRef.current);
    setPrefillPrompt(prompt);
    // Scroll hacia el composer para que sea visible
    document.getElementById('v2-inline-composer')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Zona scroll: header + thread — min-h-0 es crítico para que flex no crezca infinito */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 pt-10 pb-6">
          {/* Header de página visible — saludo encima del bubble del agente */}
          <header className="mb-8">
            <h1
              className="font-medium leading-tight"
              suppressHydrationWarning
              style={{
                fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)',
                fontSize: 'var(--v2-text-title, 2rem)',
                color: 'var(--v2-text-primary, #1A1916)',
              }}
            >
              {greeting ? `${greeting}, ${data.userName}` : ` `}
            </h1>
            <p
              className="mt-1 capitalize"
              suppressHydrationWarning
              style={{
                color: 'var(--v2-text-tertiary, #807E76)',
                fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
                fontSize: 'var(--v2-text-body, 16px)',
              }}
            >
              {dateFormatted || ' '}
            </p>
          </header>

          {/* Thread del agente */}
          <DayBriefingThread data={data} onPrompt={handlePrompt} />
        </div>
      </div>

      {/* Zona sticky: composer fijo al fondo con streaming SSE (F3) */}
      <div
        className="shrink-0 border-t"
        style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}
      >
        <div
          id="v2-inline-composer"
          className="mx-auto max-w-4xl px-8 py-4"
          style={{ minHeight: '120px' }}
        >
          {/*
           * ComposerV2WithStream (F3):
           *   - Streaming SSE token-by-token vía runSkillStream
           *   - Thread local de mensajes (usuario + agente)
           *   - initialPrompt sincroniza cuando el usuario pulsa un chip
           *   - key={prefillKey} fuerza re-mount solo cuando el mismo chip
           *     se pulsa repetidamente; en la práctica initialPrompt ya se
           *     sincroniza vía useEffect dentro de ComposerV2.
           */}
          <ComposerV2WithStream
            key={prefillKey}
            placeholder="Pregúntele algo a LexAI o use /skill…"
            autoFocus={false}
            initialPrompt={prefillPrompt}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
