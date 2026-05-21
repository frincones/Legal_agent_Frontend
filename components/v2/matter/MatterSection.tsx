'use client';

/**
 * F4-T05 · MatterSection — Accordion de una sección del MatterArtifact.
 *
 * Usa Radix Accordion vía Shadcn. Cada sección tiene:
 *  - Icono Lucide + título serif h2 + badge contador opcional.
 *  - Animación de colapso 250 ms.
 *  - Border-bottom sutil entre secciones.
 *  - Acciones contextuales opcionales en el header (lado derecho).
 */

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatterSectionProps {
  sectionKey: string;
  title: string;
  icon: LucideIcon;
  defaultExpanded: boolean;
  badge?: number | string;
  contextActions?: React.ReactNode;
  children: React.ReactNode;
}

export function MatterSection({
  sectionKey,
  title,
  icon: Icon,
  defaultExpanded,
  badge,
  contextActions,
  children,
}: MatterSectionProps) {
  return (
    <Accordion.Root
      type="single"
      collapsible
      defaultValue={defaultExpanded ? sectionKey : undefined}
      className="border-b border-[var(--v2-border-subtle,#E8E7E1)] last:border-0"
    >
      <Accordion.Item value={sectionKey}>
        <Accordion.Header asChild>
          <h2 className="m-0 p-0">
            <Accordion.Trigger
              className={cn(
                'group flex w-full items-center gap-3 px-6 py-4 text-left',
                'bg-transparent transition-colors duration-150',
                'hover:bg-[var(--v2-bg-subtle,#F2F1EC)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--v2-brand-navy,#0E2A5E)]',
                '[&[data-state=open]]:bg-[var(--v2-bg-subtle,#F2F1EC)]',
              )}
            >
              {/* Icono */}
              <span
                className="grid h-[32px] w-[32px] flex-none place-items-center rounded-lg"
                style={{ background: 'var(--v2-brand-navy-soft, #E8EDF7)', color: 'var(--v2-brand-navy, #0E2A5E)' }}
                aria-hidden="true"
              >
                <Icon size={16} strokeWidth={1.8} />
              </span>

              {/* Título */}
              <span
                className="flex-1 text-[15px] font-semibold leading-snug"
                style={{
                  fontFamily: 'var(--v2-font-serif, Georgia, serif)',
                  color: 'var(--v2-text-primary, #1A1916)',
                }}
              >
                {title}
              </span>

              {/* Badge contador */}
              {badge !== undefined && badge !== null && badge !== '' && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    background: 'var(--v2-bg-muted, #E8E7E1)',
                    color: 'var(--v2-text-secondary, #4A4944)',
                  }}
                >
                  {badge}
                </span>
              )}

              {/* Acciones contextuales */}
              {contextActions && (
                <span
                  className="ml-1 flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {contextActions}
                </span>
              )}

              {/* Chevron */}
              <ChevronDown
                size={16}
                className="flex-none text-[var(--v2-text-secondary,#4A4944)] transition-transform duration-250 group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </Accordion.Trigger>
          </h2>
        </Accordion.Header>

        <Accordion.Content
          className={cn(
            'overflow-hidden',
            'data-[state=open]:animate-accordion-down',
            'data-[state=closed]:animate-accordion-up',
          )}
          style={{
            // Fallback CSS si las clases de animación no están cargadas
            transition: 'height 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="px-6 pb-6 pt-2">{children}</div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
