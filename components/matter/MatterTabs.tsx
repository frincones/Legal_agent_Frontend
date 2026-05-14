'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export const MATTER_TABS = [
  'Resumen',
  'Análisis IA',
  'Cronología',
  'Documentos',
  'Partes',
  'Notas',
  'Calendario',
  // Sprint 2 · S2-01
  'Riesgos',
  'Citas',
  'Refundamentación',
  // Sprint 8 · billable hours + expenses
  'Horas y Gastos',
  // Sprint 15 · Memoria del despacho
  'Lecciones',
  // Sprint 16 · Colaboración
  'Comentarios',
] as const;
export type MatterTab = (typeof MATTER_TABS)[number];

export function MatterTabs({
  counts,
  panels,
}: {
  counts: Partial<Record<MatterTab, number>>;
  panels: Record<MatterTab, React.ReactNode>;
}) {
  const [active, setActive] = useState<MatterTab>('Resumen');

  // F1 · permitir que el agente de voz seleccione una pestaña tras navegar
  // (ui_open_matter_tab dispatch a custom event 'lexai:matter-tab-select').
  // También soporta querystring `?tab=Documentos` al montar.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const initial = url.searchParams.get('tab');
    if (initial && (MATTER_TABS as readonly string[]).includes(initial)) {
      setActive(initial as MatterTab);
    }
    const onTabSelect = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const tab = detail?.tab;
      if (typeof tab === 'string' && (MATTER_TABS as readonly string[]).includes(tab)) {
        setActive(tab as MatterTab);
      }
    };
    window.addEventListener('lexai:matter-tab-select', onTabSelect);
    return () => window.removeEventListener('lexai:matter-tab-select', onTabSelect);
  }, []);

  return (
    <>
      <div className="flex items-center gap-0 overflow-x-auto border-b border-line px-[var(--pad-screen)] pt-[10px]">
        {MATTER_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            data-scroll-target={t.toLowerCase().replace('á', 'a').replace(' ', '-')}
            className={cn(
              'mb-[-1px] flex-none cursor-pointer border-b-2 border-transparent bg-transparent px-3 py-[10px] text-[13px] font-medium text-ink-3 transition hover:text-ink',
              active === t && 'border-accent text-ink',
            )}
          >
            {t}
            {counts[t] !== undefined ? ` (${counts[t]})` : ''}
          </button>
        ))}
      </div>
      <div data-scroll-target={`tab-content-${active.toLowerCase().replace('á','a').replace(' ','-')}`} className="flex-1 overflow-auto p-[var(--pad-screen)]">
        {panels[active]}
      </div>
    </>
  );
}
