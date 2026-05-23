'use client';

/**
 * components/v2/document-gen/TableOfContents.tsx
 *
 * TOC sticky para el canvas de generacion de documentos.
 * Muestra todas las secciones con su estado visual + progress global.
 * Click en un item hace scroll suave a la seccion en el canvas.
 */

import { CheckCircle2, Circle, Loader2, AlertCircle, Lock } from 'lucide-react';
import type { SectionState } from '@/lib/v2/document-gen/useDocumentGenStream';

interface SectionPlanEntry {
  key: string;
  title: string;
  required: boolean;
}

export interface TableOfContentsProps {
  sectionsPlan: SectionPlanEntry[];
  sections: Record<string, SectionState>;
  activeSectionKey: string | null;
  onSectionClick?: (sectionKey: string) => void;
}

function SectionIcon({ status }: { status: SectionState['status'] | 'pending' }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 size={13} className="text-emerald-600" aria-hidden />;
    case 'streaming':
      return <Loader2 size={13} className="animate-spin text-[var(--v2-accent-copper,#B8763C)]" aria-hidden />;
    case 'error':
      return <AlertCircle size={13} className="text-red-600" aria-hidden />;
    case 'pending':
    default:
      return <Circle size={13} className="text-[var(--v2-text-tertiary,#807E76)]" aria-hidden />;
  }
}

export function TableOfContents({ sectionsPlan, sections, activeSectionKey, onSectionClick }: TableOfContentsProps) {
  const total = sectionsPlan.length;
  const completed = sectionsPlan.filter((s) => sections[s.key]?.status === 'done').length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <nav
      aria-label="Tabla de contenido del documento"
      className="sticky top-2 rounded-lg border bg-white p-3"
      style={{ borderColor: 'var(--v2-border-default, #D4D2CA)', minWidth: 220 }}
    >
      <div
        className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--v2-text-tertiary, #807E76)' }}
      >
        Tabla de contenido
      </div>

      <ul className="flex flex-col gap-1">
        {sectionsPlan.map((entry) => {
          const state = sections[entry.key];
          const status: SectionState['status'] | 'pending' = state?.status ?? 'pending';
          const isActive = entry.key === activeSectionKey;

          return (
            <li key={entry.key}>
              <button
                type="button"
                onClick={() => onSectionClick?.(entry.key)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors ${
                  isActive
                    ? 'bg-[var(--v2-brand-navy,#0E2A5E)]/8 text-[var(--v2-brand-navy,#0E2A5E)]'
                    : 'hover:bg-[var(--v2-bg-subtle,#F2F1EC)]'
                }`}
              >
                <SectionIcon status={status} />
                <span
                  className={`truncate ${
                    status === 'pending'
                      ? 'text-[var(--v2-text-tertiary,#807E76)]'
                      : 'font-medium'
                  }`}
                  style={status !== 'pending' ? { color: 'var(--v2-text-primary, #1A1916)' } : undefined}
                  title={entry.title}
                >
                  {entry.title}
                </span>
                {state?.critic_score != null && state.critic_score < 0.7 && (
                  <span className="ml-auto shrink-0 text-amber-600" title={`Crítica: ${(state.critic_score * 100).toFixed(0)}%`}>
                    <AlertCircle size={11} aria-hidden />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 border-t pt-2" style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}>
        <div className="flex items-baseline justify-between text-[10px] text-[var(--v2-text-tertiary,#807E76)]">
          <span>
            <span className="font-medium tabular-nums" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
              {completed}
            </span>{' '}
            de {total} secciones
          </span>
          <span className="font-medium tabular-nums">{pct.toFixed(0)}%</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--v2-bg-subtle,#F2F1EC)]">
          <div
            className="h-full bg-[var(--v2-brand-navy,#0E2A5E)] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </nav>
  );
}
