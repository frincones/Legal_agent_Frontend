'use client';

/**
 * F2-T04 (apoyo) · LexAI UX v2 — DayBriefingPageClient
 *
 * Client island del modulo /v2/inicio. Owna:
 *  - greeting + dateFormatted (cliente, evita hydration mismatch React #425)
 *  - prefillPrompt + prefillKey (chip → composer)
 *  - messageCount (sincronizado por ComposerV2WithStream.onMessagesChange)
 *
 * Delega TODO el layout a <InicioHeroLanding> que decide entre:
 *   - showHero=true  → composer-centric con saludo + chips (estado inicial)
 *   - showHero=false → composer en modo chat con thread + sticky
 *
 * El briefing card (DayBriefingThread) se eliminó del estado vacío para
 * lograr el diseño minimalista pedido (ref. Claude/ChatGPT/Stitch).
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { type DayBriefingData } from '@/lib/v2/dayBriefing';
import { InicioHeroLanding } from './InicioHeroLanding';

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

export function DayBriefingPageClient({ data }: DayBriefingPageClientProps) {
  /**
   * greeting se inicializa vacio en SSR; se rellena en cliente para no
   * disparar el hydration mismatch React #425.
   */
  const [greeting, setGreeting] = useState('');

  // Prompt prefilled desde chips de accion rapida o query params.
  const [prefillPrompt, setPrefillPrompt] = useState('');
  const prefillCounterRef = useRef(0);
  const [prefillKey, setPrefillKey] = useState(0);

  // messageCount sincronizado por ComposerV2WithStream — controla hero vs chat.
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    setGreeting(computeGreeting());
  }, []);

  // Leer query params ?skill=...&prompt=... (navegacion desde sidebar)
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
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handlePrompt = useCallback((prompt: string) => {
    prefillCounterRef.current += 1;
    setPrefillKey(prefillCounterRef.current);
    setPrefillPrompt(prompt);
  }, []);

  return (
    <InicioHeroLanding
      greeting={greeting}
      firstName={data.userFirstName || data.userName}
      prefillPrompt={prefillPrompt}
      prefillKey={prefillKey}
      onChipSelect={handlePrompt}
      onMessagesChange={setMessageCount}
      showHero={messageCount === 0}
    />
  );
}
