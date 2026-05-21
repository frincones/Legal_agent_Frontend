'use client';

/**
 * F2-T04 (apoyo) · LexAI UX v2 — DayBriefingPageClient
 *
 * Client island que:
 *  - Owna la ref del composer y la conecta con DayBriefingThread (chips).
 *  - Renderiza el layout scroll + sticky: thread scrollea, composer fijo abajo.
 *  - Muestra el header de saludo + fecha encima del thread (fuera del bubble).
 *
 * El composer ya NO vive adentro del thread — está en la zona sticky del bottom.
 */

import { useRef, useCallback } from 'react';
import { type DayBriefingData } from '@/lib/v2/dayBriefing';
import { DayBriefingThread } from './DayBriefingThread';
import { InlineComposerV2, type InlineComposerV2Handle } from './InlineComposerV2';

interface DayBriefingPageClientProps {
  data: DayBriefingData;
}

function formatDateES(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DayBriefingPageClient({ data }: DayBriefingPageClientProps) {
  const composerRef = useRef<InlineComposerV2Handle>(null);

  const handlePrompt = useCallback((prompt: string) => {
    composerRef.current?.prefill(prompt);
    // Scroll hacia el composer para que sea visible
    document.getElementById('v2-inline-composer')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  const dateFormatted = formatDateES();

  return (
    <>
      {/* Zona scroll: header + thread */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 pt-10 pb-6">
          {/* Header de página visible — saludo encima del bubble del agente */}
          <header className="mb-8">
            <h1
              className="font-medium leading-tight"
              style={{
                fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)',
                fontSize: 'var(--v2-text-title, 2rem)',
                color: 'var(--v2-text-primary, #1A1916)',
              }}
            >
              {data.greeting}, {data.userName}
            </h1>
            <p
              className="mt-1 capitalize"
              style={{
                color: 'var(--v2-text-tertiary, #807E76)',
                fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
                fontSize: 'var(--v2-text-body, 16px)',
              }}
            >
              {dateFormatted}
            </p>
          </header>

          {/* Thread del agente */}
          <DayBriefingThread data={data} onPrompt={handlePrompt} />
        </div>
      </div>

      {/* Zona sticky: composer fijo al fondo — patrón Claude.ai */}
      <div
        className="shrink-0 border-t"
        style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}
      >
        <div
          id="v2-inline-composer"
          className="mx-auto max-w-4xl px-8 py-4"
        >
          <InlineComposerV2
            ref={composerRef}
            placeholder="Pregúntele algo a LexAI o use /skill…"
          />
        </div>
      </div>
    </>
  );
}
