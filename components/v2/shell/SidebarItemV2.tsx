'use client';

/**
 * F1-T02 · LexAI UX v2 — SidebarItemV2
 *
 * Item de navegación para el SidebarV2. Renderiza un Link con icono Lucide
 * + label. En modo colapsado muestra solo el icono con Tooltip.
 *
 * Props:
 *   icon      — componente Lucide (LucideIcon)
 *   label     — texto visible (en expandido) y tooltip (en colapsado)
 *   href      — destino de navegación
 *   badge     — número o texto opcional en pill a la derecha
 *   collapsed — si el sidebar está colapsado
 *   active    — si esta ruta está activa
 *   onClick   — handler opcional (para acciones en lugar de navegación)
 */
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface SidebarItemV2Props {
  icon: LucideIcon;
  label: string;
  href?: string;
  badge?: string | number;
  collapsed?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarItemV2({
  icon: Icon,
  label,
  href,
  badge,
  collapsed = false,
  active = false,
  onClick,
}: SidebarItemV2Props) {
  const content = (
    <span
      className={[
        'group flex items-center gap-[10px] rounded-lg transition-colors duration-150 cursor-pointer select-none',
        collapsed ? 'w-10 h-10 justify-center p-0' : 'px-[8px] py-[6px] w-full',
        active
          ? 'bg-[var(--v2-brand-navy-soft,#E8EDF7)] text-[var(--v2-brand-navy,#0E2A5E)] border-l-[3px] border-[var(--v2-brand-navy,#0E2A5E)] pl-[7px]'
          : 'text-[var(--v2-text-secondary,#4A4944)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)] hover:text-[var(--v2-text-primary,#1A1916)] border-l-[3px] border-transparent',
      ].join(' ')}
    >
      <Icon
        size={16}
        strokeWidth={active ? 2.2 : 1.8}
        className="shrink-0"
        aria-hidden
      />
      {!collapsed && (
        <span className="flex-1 min-w-0 truncate text-[14px] font-normal leading-none">
          {label}
        </span>
      )}
      {!collapsed && badge !== undefined && badge !== null && (
        <span className="ml-auto inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-md bg-[var(--v2-bg-muted,#E8E7E1)] px-[5px] text-[11px] font-medium text-[var(--v2-text-tertiary,#807E76)]">
          {badge}
        </span>
      )}
    </span>
  );

  const focusClass =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-2 rounded-lg';

  const wrapped = onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`w-full flex ${focusClass}`}
    >
      {content}
    </button>
  ) : href ? (
    <Link href={href} aria-label={label} className={`flex w-full ${focusClass}`}>
      {content}
    </Link>
  ) : (
    <div className="flex w-full">{content}</div>
  );

  if (!collapsed) return wrapped;

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{wrapped}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-50 rounded-md bg-[var(--v2-text-primary,#1A1916)] px-[10px] py-[6px] text-[12px] font-medium text-[var(--v2-text-inverse,#FAFAF7)] shadow-lg"
          >
            {label}
            {badge !== undefined && badge !== null && (
              <span className="ml-2 opacity-70">({badge})</span>
            )}
            <Tooltip.Arrow className="fill-[var(--v2-text-primary,#1A1916)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
