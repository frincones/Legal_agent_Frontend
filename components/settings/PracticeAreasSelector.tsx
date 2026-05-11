'use client';

import { useCallback } from 'react';
import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRACTICE_AREAS, PRACTICE_AREA_IDS, type PracticeArea } from '@/lib/auth/roles';

/**
 * Multi-select de áreas de práctica con marcado de área principal.
 *
 * - Click sobre una pill → toggle membership.
 * - Click sobre la estrella → marca como `primary_area` (única, mutex).
 * - Si quitas el área marcada como primary, primary se vacía.
 *
 * Stateless por diseño: el padre controla `selected` y `primary` y
 * recibe los cambios. Esto facilita usarlo desde el wizard de
 * onboarding y desde /settings/perfil sin duplicar estado.
 */

export function PracticeAreasSelector({
  selected,
  primary,
  onChange,
  disabled = false,
}: {
  selected: PracticeArea[];
  primary?: PracticeArea | null;
  onChange: (next: { areas: PracticeArea[]; primary: PracticeArea | null }) => void;
  disabled?: boolean;
}) {
  const set = new Set(selected);

  const toggle = useCallback(
    (area: PracticeArea) => {
      if (disabled) return;
      const next = new Set(set);
      let nextPrimary = primary ?? null;
      if (next.has(area)) {
        next.delete(area);
        if (nextPrimary === area) nextPrimary = null;
      } else {
        next.add(area);
      }
      onChange({
        areas: PRACTICE_AREA_IDS.filter((a) => next.has(a)),
        primary: nextPrimary,
      });
    },
    [set, primary, onChange, disabled],
  );

  const setAsPrimary = useCallback(
    (area: PracticeArea) => {
      if (disabled) return;
      const next = new Set(set);
      next.add(area); // ensure it's selected when promoted to primary
      onChange({
        areas: PRACTICE_AREA_IDS.filter((a) => next.has(a)),
        primary: area,
      });
    },
    [set, onChange, disabled],
  );

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Áreas de práctica">
      {PRACTICE_AREA_IDS.map((area) => {
        const meta = PRACTICE_AREAS[area];
        const isSelected = set.has(area);
        const isPrimary = primary === area;
        return (
          <span
            key={area}
            className={cn(
              'group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors',
              isSelected
                ? 'border-accent/50 bg-accent-soft text-accent-ink'
                : 'border-line bg-bg-elev text-ink-2 hover:border-accent/30',
              disabled && 'pointer-events-none opacity-60',
            )}
            title={meta.hint}
          >
            <button
              type="button"
              onClick={() => toggle(area)}
              className="inline-flex items-center gap-1"
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Quitar' : 'Agregar'} ${meta.label}`}
              disabled={disabled}
            >
              {isSelected && <Check size={11} aria-hidden="true" />}
              <span>{meta.label}</span>
            </button>
            {isSelected && (
              <button
                type="button"
                onClick={() => setAsPrimary(area)}
                className={cn(
                  'ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full',
                  isPrimary ? 'text-amber-500' : 'text-ink-3 hover:text-amber-400',
                )}
                aria-label={`Marcar ${meta.label} como área principal`}
                aria-pressed={isPrimary}
                title={isPrimary ? 'Área principal' : 'Marcar como principal'}
                disabled={disabled}
              >
                <Star size={11} fill={isPrimary ? 'currentColor' : 'none'} aria-hidden="true" />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
