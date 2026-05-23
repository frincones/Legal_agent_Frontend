'use client';

/**
 * components/v2/home/QuickActionChip.tsx
 *
 * Pildora minimalista tipo Apple que se renderiza alrededor del composer
 * en /v2/inicio (estado vacio). Al pulsar, llama `onSelect(prompt)` y el
 * padre pre-llena el textarea del composer. NO ejecuta automaticamente.
 *
 * Diferencia con `SuggestionChip`:
 *  - QuickActionChip se usa standalone fuera del briefing card.
 *  - Fondo transparente en reposo + borde sutil (estetica "ghost").
 *  - Hover: fondo subtle.
 *  - Icon size 15 (ligero) vs 14 del SuggestionChip.
 */

import { type LucideIcon } from 'lucide-react';

export interface QuickActionChipProps {
  /** Icono lucide. */
  icon: LucideIcon;
  /** Etiqueta visible. */
  label: string;
  /** Prompt a inyectar en el composer. */
  prompt: string;
  /** Callback que recibe el prompt — el padre setea el initialPrompt. */
  onSelect: (prompt: string) => void;
}

export function QuickActionChip({ icon: Icon, label, prompt, onSelect }: QuickActionChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(prompt)}
      aria-label={label}
      className={[
        'inline-flex items-center gap-2 rounded-full',
        'border px-4 py-2',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      ].join(' ')}
      style={{
        backgroundColor: 'transparent',
        borderColor: 'var(--v2-border-default, #D4D2CA)',
        color: 'var(--v2-text-secondary, #4A4944)',
        fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
        fontSize: '13px',
        lineHeight: '18px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          'var(--v2-bg-subtle, #F2F1EC)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
      }}
    >
      <Icon size={15} strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
    </button>
  );
}
