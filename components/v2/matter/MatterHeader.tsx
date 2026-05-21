'use client';

/**
 * F4-T03 · MatterHeader — Encabezado del MatterArtifact.
 *
 * Muestra:
 *  - Breadcrumb: Inicio › Casos › [Display ID]
 *  - Título serif grande del caso.
 *  - Pills de estado y prioridad.
 *  - CTA primario "Trabajar en canvas".
 *  - Acciones secundarias: "Iniciar voz" / "Compartir".
 */

import Link from 'next/link';
import { Mic, Share2, FileEdit, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Matter } from '@/lib/api/rsc-fetchers';

const STATUS_LABELS: Record<string, string> = {
  activo: 'Activo',
  archivado: 'Archivado',
  cerrado: 'Cerrado',
  pendiente: 'Pendiente',
};

const STATUS_STYLES: Record<string, string> = {
  activo: 'bg-emerald-100 text-emerald-800',
  archivado: 'bg-gray-100 text-gray-600',
  cerrado: 'bg-gray-200 text-gray-500',
  pendiente: 'bg-amber-100 text-amber-800',
};

const PRIORITY_LABELS: Record<string, string> = {
  alta: 'Prioridad alta',
  media: 'Prioridad media',
  baja: 'Prioridad baja',
};

const PRIORITY_STYLES: Record<string, string> = {
  alta: 'bg-[var(--v2-brand-navy,#0E2A5E)] text-white',
  media: 'bg-[var(--v2-bg-muted,#E8E7E1)] text-[var(--v2-text-secondary,#4A4944)]',
  baja: 'bg-[var(--v2-bg-subtle,#F2F1EC)] text-[var(--v2-text-secondary,#4A4944)]',
};

interface MatterHeaderProps {
  matter: Matter;
  canvasHref: string;
}

export function MatterHeader({ matter, canvasHref }: MatterHeaderProps) {
  const statusKey = (matter.status ?? 'activo').toLowerCase();
  const priorityKey = (matter.priority ?? 'media').toLowerCase();

  return (
    <header className="border-b border-[var(--v2-border-subtle,#E8E7E1)] px-6 pb-6 pt-5">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-[12px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
        <Link
          href="/"
          className="hover:underline"
          style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
        >
          Inicio
        </Link>
        <ChevronRight size={12} aria-hidden="true" />
        <Link
          href="/casos"
          className="hover:underline"
          style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
        >
          Casos
        </Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span style={{ color: 'var(--v2-text-primary, #1A1916)', fontWeight: 500 }}>
          {matter.display_id ?? matter.expediente ?? matter.id.slice(0, 8).toUpperCase()}
        </span>
      </nav>

      {/* Título */}
      <h1
        className="mb-3 font-normal leading-tight tracking-[-0.02em]"
        style={{
          fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
          fontFamily: 'var(--v2-font-serif, Georgia, serif)',
          color: 'var(--v2-text-primary, #1A1916)',
        }}
      >
        {matter.titulo}
      </h1>

      {/* Pills de estado y metadatos */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium',
            STATUS_STYLES[statusKey] ?? STATUS_STYLES.activo,
          )}
        >
          {STATUS_LABELS[statusKey] ?? matter.status}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium',
            PRIORITY_STYLES[priorityKey] ?? PRIORITY_STYLES.media,
          )}
        >
          {PRIORITY_LABELS[priorityKey] ?? matter.priority}
        </span>
        {matter.materia && (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
            style={{ background: 'var(--v2-accent-copper-soft, #F5EBE0)', color: 'var(--v2-accent-copper, #B8763C)' }}
          >
            {matter.materia.charAt(0).toUpperCase() + matter.materia.slice(1)}
          </span>
        )}
        {matter.etapa_procesal && (
          <span
            className="text-[12px]"
            style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
          >
            {matter.etapa_procesal}
          </span>
        )}
        {matter.tribunal && (
          <span
            className="text-[12px]"
            style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
          >
            · {matter.tribunal}
          </span>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-2">
        {/* CTA primario */}
        <Link
          href={canvasHref}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium text-white',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-2',
          )}
          style={{
            background: 'var(--v2-brand-navy, #0E2A5E)',
            outlineColor: 'var(--v2-brand-navy, #0E2A5E)',
          }}
          onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--v2-brand-navy-hover, #0a2049)')}
          onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--v2-brand-navy, #0E2A5E)')}
        >
          <FileEdit size={14} aria-hidden="true" />
          Trabajar en canvas
        </Link>

        {/* Botón de voz */}
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium',
            'border bg-transparent transition-colors duration-150',
            'hover:bg-[var(--v2-bg-subtle,#F2F1EC)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-2',
          )}
          style={{
            borderColor: 'var(--v2-bg-muted, #E8E7E1)',
            color: 'var(--v2-text-secondary, #4A4944)',
            outlineColor: 'var(--v2-brand-navy, #0E2A5E)',
          }}
          onClick={() => window.dispatchEvent(new CustomEvent('lexai:open-voice'))}
        >
          <Mic size={14} aria-hidden="true" />
          Iniciar voz
        </button>

        {/* Compartir */}
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium',
            'border bg-transparent transition-colors duration-150',
            'hover:bg-[var(--v2-bg-subtle,#F2F1EC)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-2',
          )}
          style={{
            borderColor: 'var(--v2-bg-muted, #E8E7E1)',
            color: 'var(--v2-text-secondary, #4A4944)',
            outlineColor: 'var(--v2-brand-navy, #0E2A5E)',
          }}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
            } catch {
              // fallback silencioso
            }
          }}
        >
          <Share2 size={14} aria-hidden="true" />
          Compartir
        </button>
      </div>
    </header>
  );
}
