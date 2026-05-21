'use client';

/**
 * F4-T06 · SectionNotas — Notas del despacho.
 * Estrategia: REESCRITA con tokens v2.
 * Datos: pasados como props desde el Server Component.
 */

import { formatRelative } from '@/lib/utils';
import { StickyNote } from 'lucide-react';

interface Nota {
  body: string;
  created_at: string;
}

interface Props {
  notas: Nota[];
}

export function SectionNotas({ notas }: Props) {
  if (notas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <StickyNote size={28} style={{ color: 'var(--v2-bg-muted, #E8E7E1)' }} aria-hidden="true" />
        <p className="text-[13px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
          Sin notas. Agrega una con voz: &ldquo;Hola LexAI, agrega nota al caso&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notas.map((n, i) => (
        <div
          key={i}
          className="rounded-xl border px-4 py-3"
          style={{ borderColor: 'var(--v2-bg-muted, #E8E7E1)', background: 'var(--v2-bg-surface, #FFFFFF)' }}
        >
          <div className="mb-1 text-[11px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
            {formatRelative(n.created_at)}
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
            {n.body}
          </p>
        </div>
      ))}
    </div>
  );
}
