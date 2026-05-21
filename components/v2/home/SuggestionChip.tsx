'use client';

/**
 * F2-T03 · LexAI UX v2 — SuggestionChip
 *
 * Pill clickeable que dispara un prompt hacia el composer de la home v2.
 * Usa tokens v2 (--v2-bg-subtle, --v2-border-default, etc.) para alinearse
 * con el design system de Fase 0.
 */

import { type LucideIcon } from 'lucide-react';

export interface SuggestionChipProps {
  /** Texto visible en el chip. */
  label: string;
  /** Prompt que se enviará al composer al hacer click. */
  prompt: string;
  /** Icono Lucide opcional. */
  icon?: LucideIcon;
  /** Callback que recibe el prompt — el padre decide qué hacer con él. */
  onClick: (prompt: string) => void;
}

export function SuggestionChip({ label, prompt, icon: Icon, onClick }: SuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(prompt)}
      className={[
        'inline-flex items-center gap-1.5 rounded-full',
        'border px-3 py-1.5 text-sm font-medium',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
      ].join(' ')}
      style={{
        backgroundColor: 'var(--v2-bg-subtle, #F2F1EC)',
        borderColor: 'var(--v2-border-default, #D4D2CA)',
        color: 'var(--v2-text-secondary, #4A4944)',
        fontSize: 'var(--v2-text-caption, 13px)',
        lineHeight: 'var(--v2-text-caption-lh, 18px)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--v2-bg-muted, #E8E7E1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--v2-bg-subtle, #F2F1EC)';
      }}
    >
      {Icon && <Icon size={14} aria-hidden strokeWidth={1.75} />}
      {label}
    </button>
  );
}
