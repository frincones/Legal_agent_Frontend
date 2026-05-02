'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export const MATTER_TABS = ['Resumen', 'Análisis IA', 'Cronología', 'Documentos', 'Partes', 'Notas', 'Calendario'] as const;
export type MatterTab = (typeof MATTER_TABS)[number];

export function MatterTabs({
  counts,
  panels,
}: {
  counts: Partial<Record<MatterTab, number>>;
  panels: Record<MatterTab, React.ReactNode>;
}) {
  const [active, setActive] = useState<MatterTab>('Resumen');
  return (
    <>
      <div className="flex items-center gap-0 border-b border-line px-[var(--pad-screen)] pt-[10px]">
        {MATTER_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            className={cn(
              'mb-[-1px] cursor-pointer border-b-2 border-transparent bg-transparent px-3 py-[10px] text-[13px] font-medium text-ink-3 transition hover:text-ink',
              active === t && 'border-accent text-ink',
            )}
          >
            {t}
            {counts[t] !== undefined ? ` (${counts[t]})` : ''}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-[var(--pad-screen)]">{panels[active]}</div>
    </>
  );
}
