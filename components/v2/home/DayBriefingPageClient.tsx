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
 *
 * UX v2 fixes:
 *  - max-w-[720px] en toda la columna central para reading-width consistente.
 *  - Header + briefing en zona scroll; composer en zona fija con min-height prominente.
 *  - Composer section tiene maxHeight:60vh para no dominar la pantalla.
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

  // Leer query params ?skill=...&prompt=... al montar (navegación desde sidebar en otras páginas)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const skill = params.get('skill');
    const prompt = params.get('prompt');
    if (skill || prompt) {
      const text = [skill, prompt].filter(Boolean).join(' ');
      prefillCounterRef.current += 1;
      setPrefillKey(prefillCounterRef.current);
      setPrefillPrompt(text);
      // Limpiar la URL para no repetir en navegaciones futuras
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handlePrompt = useCallback((prompt: string) => {
    prefillCounterRef.current += 1;
    setPrefillKey(prefillCounterRef.current);
    setPrefillPrompt(prompt);
    // Scroll hacia el composer para que sea visible
    document.getElementById('v2-inline-composer')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, []);

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
      {/*
       * Zona scroll: header + briefing proactivo del agente.
       * Patrón Claude.ai/ChatGPT: cuando NO hay mensajes (estado inicial)
       * centramos el contenido verticalmente para evitar el gap enorme entre
       * briefing y composer. Cuando hay mensajes en el thread, top-align
       * normal con scroll.
       * min-h-0 es critico para que flex no crezca infinito.
       */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center">
        <div className="mx-auto w-full max-w-[720px] px-6 py-8">
          {/* Header de pagina — saludo + fecha. suppressHydrationWarning evita mismatch SSR/CSR. */}
          <header className="mb-6">
            <h1
              className="font-medium leading-tight"
              suppressHydrationWarning
              style={{
                fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: 'var(--v2-text-primary, #1A1916)',
              }}
            >
              {greeting ? `${greeting}, ${data.userName}` : ' '}
            </h1>
            <p
              className="mt-1 capitalize"
              suppressHydrationWarning
              style={{
                color: 'var(--v2-text-tertiary, #807E76)',
                fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
                fontSize: '15px',
              }}
            >
              {dateFormatted || ' '}
            </p>
          </header>

          {/* Briefing proactivo del agente — turno inicial estatico */}
          <DayBriefingThread data={data} onPrompt={handlePrompt} />
        </div>
      </div>

      {/*
       * Zona compositor: ComposerV2WithStream (thread local + composer sticky).
       * Separada del briefing por un borde sutil.
       * min-height 200px para que el composer sea prominente desde el inicio.
       * max-height 60vh para no dominar la pantalla cuando hay muchos mensajes.
       * flex + flex-col necesarios para que el hijo ocupe el espacio correctamente.
       */}
      <div
        id="v2-inline-composer"
        className="shrink-0 border-t flex flex-col"
        style={{
          borderColor: 'var(--v2-border-subtle, #E8E7E1)',
          minHeight: 'clamp(160px, 25vh, 280px)',
          maxHeight: '55vh',
        }}
      >
        {/*
         * ComposerV2WithStream (F3):
         *   - Streaming SSE token-by-token via runSkillStream
         *   - Thread local de mensajes (usuario + agente)
         *   - initialPrompt sincroniza cuando el usuario pulsa un chip
         *   - key={prefillKey} fuerza re-mount solo cuando el mismo chip
         *     se pulsa repetidamente; en la practica initialPrompt ya se
         *     sincroniza via useEffect dentro de ComposerV2.
         */}
        <ComposerV2WithStream
          key={prefillKey}
          placeholder="Preguntele algo a LexAI o use /skill..."
          autoFocus={false}
          initialPrompt={prefillPrompt}
          className="flex-1 min-h-0"
        />
      </div>
    </div>
  );
}
