'use client';

import { Ic, type IconName } from '@/components/atoms/icons';
import { cn } from '@/lib/utils';
import { MODES, MODE_IDS, type ModoEjercicio } from '@/lib/auth/roles';

/**
 * Card-grid de los 5 modos de ejercicio profesional.
 * Único-seleccionable. Usado en el onboarding wizard y /settings/perfil.
 */
export function ModeSelector({
  selected,
  onChange,
  disabled = false,
}: {
  selected: ModoEjercicio | null;
  onChange: (next: ModoEjercicio) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
      role="radiogroup"
      aria-label="Modo de ejercicio"
    >
      {MODE_IDS.map((id) => {
        const m = MODES[id];
        const isActive = selected === id;
        const icon = (Ic[m.icon as IconName] ?? Ic.user) as React.ReactNode;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={cn(
              'group flex h-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
              isActive
                ? 'border-accent bg-accent-soft shadow-sm'
                : 'border-line bg-bg-elev hover:border-accent/40',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <span
              className={cn(
                'grid h-9 w-9 flex-none place-items-center rounded-md',
                isActive ? 'bg-accent text-white' : 'bg-bg-sunken text-ink-2',
              )}
            >
              {icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-ink">{m.label}</span>
              <span className="mt-0.5 block text-[11.5px] muted">{m.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
