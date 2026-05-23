'use client';

/**
 * components/v2/document-gen/SectionDiff.tsx
 *
 * Vista diff inline para confirmar/revertir cambios de regeneracion.
 * Muestra side-by-side el contenido anterior (rojo tachado) vs nuevo
 * (verde subrayado) y deja al usuario decidir aceptar o revertir.
 */

import { Check, Undo2 } from 'lucide-react';
import { MarkdownContent } from '@/components/assistant/MarkdownContent';

export interface SectionDiffProps {
  sectionTitle: string;
  originalMd: string;
  newMd: string;
  onAccept: () => void;
  onRevert: () => void;
}

export function SectionDiff({ sectionTitle, originalMd, newMd, onAccept, onRevert }: SectionDiffProps) {
  return (
    <div
      className="my-3 rounded-lg border-2 bg-white shadow-sm"
      style={{ borderColor: 'var(--v2-accent-copper, #B8763C)' }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
      >
        <div
          className="text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--v2-accent-copper, #B8763C)' }}
        >
          Diff propuesto: {sectionTitle}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRevert}
            className="inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
            style={{
              borderColor: 'var(--v2-border-default, #D4D2CA)',
              color: 'var(--v2-text-secondary, #4A4944)',
            }}
          >
            <Undo2 size={12} aria-hidden />
            Revertir
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--v2-brand-navy, #0E2A5E)' }}
          >
            <Check size={12} aria-hidden />
            Aceptar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0" style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}>
        <div className="px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-red-700">
            Anterior
          </div>
          <div
            className="prose prose-sm max-w-none text-[12px] line-through opacity-70"
            style={{ color: 'var(--v2-text-tertiary, #807E76)' }}
          >
            <MarkdownContent source={originalMd || '(vacío)'} density="compact" />
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Nuevo
          </div>
          <div
            className="prose prose-sm max-w-none text-[12px]"
            style={{ color: 'var(--v2-text-primary, #1A1916)' }}
          >
            <MarkdownContent source={newMd || '(vacío)'} density="compact" />
          </div>
        </div>
      </div>
    </div>
  );
}
