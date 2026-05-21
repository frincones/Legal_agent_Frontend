'use client';

/**
 * F2-T04 (apoyo) · LexAI UX v2 — DayBriefingPageClient
 *
 * Wrapper client que conecta DayBriefingThread (chips) con InlineComposerV2.
 * El estado del prompt prefilled vive aquí para no contaminar el RSC padre.
 */

import { useRef, useCallback } from 'react';
import { type DayBriefingData } from '@/lib/v2/dayBriefing';
import { DayBriefingThread } from './DayBriefingThread';
import { InlineComposerV2, type InlineComposerV2Handle } from './InlineComposerV2';

interface DayBriefingPageClientProps {
  data: DayBriefingData;
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

  return (
    <div className="flex flex-col gap-8">
      <DayBriefingThread data={data} onPrompt={handlePrompt} />

      <div id="v2-inline-composer">
        <InlineComposerV2
          ref={composerRef}
          placeholder="Pregúntele algo a LexAI o use /skill…"
        />
      </div>
    </div>
  );
}
