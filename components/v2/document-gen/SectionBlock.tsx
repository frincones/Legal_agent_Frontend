'use client';

/**
 * components/v2/document-gen/SectionBlock.tsx
 *
 * Wrapper visual para una seccion de documento generado.
 * Renderiza el contenido markdown + header + estados visuales + actions.
 *
 * NOTA: en Sprint 4 esto se implementara como TipTap node extension custom
 * (con NodeView React). Por ahora es un componente React standalone que el
 * DocumentStreamingCanvas renderiza para cada section.
 *
 * 7 estados visuales:
 *   pending      borde dashed, opacity 0.45
 *   streaming    borde 3px navy izq, fondo navy 4%, cursor parpadeante
 *   done         borde 1px subtle
 *   verified     borde emerald 30%, badge "Verificada"
 *   regenerating borde 3px copper, spinner copper
 *   error        borde 3px red, badge "Error"
 *   locked       borde copper, icono Lock
 */

import { useState } from 'react';
import { CheckCircle2, Loader2, Lock, AlertCircle, Circle } from 'lucide-react';
import { MarkdownContent } from '@/components/assistant/MarkdownContent';
import { StreamingCursor } from '@/components/v2/composer/StreamingCursor';
import { SectionActions } from './SectionActions';

export type SectionStatus =
  | 'pending'
  | 'streaming'
  | 'done'
  | 'verified'
  | 'regenerating'
  | 'error'
  | 'locked';

export interface SectionBlockProps {
  sectionKey: string;
  sectionTitle: string;
  sectionOrder: number;
  status: SectionStatus;
  contentMd: string;
  criticScore?: number;
  citationCount?: number;
  isUserEdited?: boolean;
  isLocked?: boolean;
  errorMessage?: string;
  onRegenerate?: (sectionKey: string) => void;
  onEdit?: (sectionKey: string) => void;
  onToggleLock?: (sectionKey: string) => void;
  onDelete?: (sectionKey: string) => void;
}

const STATUS_STYLES: Record<SectionStatus, { border: string; bg: string; badge: string | null }> = {
  pending: {
    border: 'border-l border-dashed border-[var(--v2-border-default,#D4D2CA)]',
    bg: '',
    badge: null,
  },
  streaming: {
    border: 'border-l-[3px] border-[var(--v2-brand-navy,#0E2A5E)]',
    bg: 'bg-[rgba(14,42,94,0.04)]',
    badge: null,
  },
  done: {
    border: 'border-l border-[var(--v2-border-subtle,#E8E7E1)]',
    bg: '',
    badge: null,
  },
  verified: {
    border: 'border-l border-emerald-500/30',
    bg: 'bg-emerald-50/30',
    badge: 'Verificada',
  },
  regenerating: {
    border: 'border-l-[3px] border-[var(--v2-accent-copper,#B8763C)]',
    bg: 'bg-[rgba(184,118,60,0.06)]',
    badge: 'Regenerando',
  },
  error: {
    border: 'border-l-[3px] border-red-500',
    bg: 'bg-red-50/30',
    badge: 'Error',
  },
  locked: {
    border: 'border-l border-[var(--v2-accent-copper,#B8763C)]',
    bg: 'bg-[rgba(184,118,60,0.04)]',
    badge: 'Protegida',
  },
};

function StatusIcon({ status }: { status: SectionStatus }) {
  switch (status) {
    case 'verified':
      return <CheckCircle2 size={14} className="text-emerald-600" aria-hidden />;
    case 'done':
      return <CheckCircle2 size={14} className="text-[var(--v2-text-tertiary,#807E76)]" aria-hidden />;
    case 'streaming':
      return <Loader2 size={14} className="animate-spin text-[var(--v2-accent-copper,#B8763C)]" aria-hidden />;
    case 'regenerating':
      return <Loader2 size={14} className="animate-spin text-[var(--v2-accent-copper,#B8763C)]" aria-hidden />;
    case 'error':
      return <AlertCircle size={14} className="text-red-600" aria-hidden />;
    case 'locked':
      return <Lock size={14} className="text-[var(--v2-accent-copper,#B8763C)]" aria-hidden />;
    case 'pending':
    default:
      return <Circle size={14} className="text-[var(--v2-text-tertiary,#807E76)]" aria-hidden />;
  }
}

export function SectionBlock({
  sectionKey,
  sectionTitle,
  sectionOrder,
  status,
  contentMd,
  criticScore,
  citationCount,
  isUserEdited = false,
  isLocked = false,
  errorMessage,
  onRegenerate,
  onEdit,
  onToggleLock,
  onDelete,
}: SectionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const styles = STATUS_STYLES[status];
  const isActive = status === 'streaming' || status === 'regenerating';
  const showActions = (status === 'done' || status === 'verified' || status === 'locked') && (onRegenerate || onEdit || onToggleLock || onDelete);

  return (
    <section
      id={`section-${sectionKey}`}
      data-section-key={sectionKey}
      data-section-status={status}
      className={`relative scroll-mt-20 rounded-r-md px-5 py-4 transition-colors ${styles.border} ${styles.bg}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header: numero + titulo + status badge */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusIcon status={status} />
          <h3
            className="text-[14px] font-semibold uppercase tracking-wide"
            style={{
              fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)',
              color: 'var(--v2-text-primary, #1A1916)',
              letterSpacing: '0.02em',
            }}
          >
            {String(sectionOrder).padStart(2, '0')}. {sectionTitle}
          </h3>
          {styles.badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                status === 'verified'
                  ? 'bg-emerald-100 text-emerald-700'
                  : status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : status === 'locked'
                      ? 'bg-[var(--v2-accent-copper,#B8763C)]/15 text-[var(--v2-accent-copper,#B8763C)]'
                      : 'bg-[var(--v2-accent-copper,#B8763C)]/15 text-[var(--v2-accent-copper,#B8763C)]'
              }`}
            >
              {styles.badge}
            </span>
          )}
          {isUserEdited && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase text-blue-700">
              Editada
            </span>
          )}
        </div>

        {/* Actions toolbar on hover */}
        {showActions && (isHovered || isLocked) && (
          <SectionActions
            sectionKey={sectionKey}
            sectionTitle={sectionTitle}
            isLocked={isLocked}
            isRegenerating={false}
            isUserEdited={isUserEdited}
            onRegenerate={onRegenerate}
            onEdit={onEdit}
            onToggleLock={onToggleLock}
            onDelete={onDelete}
          />
        )}
      </div>

      {/* Metadata bar (critic score + citations) */}
      {(criticScore != null || (citationCount != null && citationCount > 0)) && (
        <div className="mb-2 flex items-center gap-3 text-[10px] text-[var(--v2-text-tertiary,#807E76)]">
          {criticScore != null && (
            <span
              className={
                criticScore >= 0.8
                  ? 'text-emerald-600'
                  : criticScore >= 0.5
                    ? 'text-amber-600'
                    : 'text-red-600'
              }
            >
              Calidad: <span className="font-medium tabular-nums">{(criticScore * 100).toFixed(0)}%</span>
            </span>
          )}
          {citationCount != null && citationCount > 0 && (
            <span>
              Citas: <span className="font-medium tabular-nums">{citationCount}</span>
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-sm max-w-none break-words"
        style={{
          fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
          color: 'var(--v2-text-primary, #1A1916)',
          lineHeight: 1.65,
        }}
      >
        {contentMd ? (
          <MarkdownContent source={contentMd} density="compact" />
        ) : status === 'pending' ? (
          <span className="text-[12px] italic text-[var(--v2-text-tertiary,#807E76)]">
            (pendiente)
          </span>
        ) : (
          <span className="text-[12px] italic text-[var(--v2-text-tertiary,#807E76)]">
            Generando contenido...
          </span>
        )}
        {isActive && <StreamingCursor streaming />}
      </div>

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-[12px] text-red-700">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
    </section>
  );
}
