'use client';

/**
 * components/v2/document-gen/CitationBadgeInline.tsx
 *
 * Badge inline para citas legales dentro del texto del documento.
 * 4 estados con popover Radix con detalles.
 *
 * Estados:
 *  verified     verde, sentencia verificada en BD
 *  suspicious   ambar, hay match pero metadata difiere
 *  not_found    rojo, no se encontro en BD ni live fetch
 *  pending      gris, aun verificando
 */

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Shield, ShieldAlert, ShieldX, ShieldQuestion, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

export type CitationStatus = 'verified' | 'suspicious' | 'not_found' | 'pending';

export interface CitationBadgeInlineProps {
  /** Referencia citada en el texto (ej. "T-760/08", "Art. 49 CN"). */
  reference: string;
  /** Estado de la verificacion. */
  status: CitationStatus;
  /** Metadata adicional opcional. */
  source?: string;
  year?: number;
  court?: string;
  magistrate?: string;
  /** Snippet del texto fuente para mostrar en popover. */
  textSnippet?: string;
  /** URL al documento completo. */
  sourceUrl?: string;
}

const STATUS_CONFIG: Record<CitationStatus, {
  bg: string;
  text: string;
  icon: typeof Shield;
  label: string;
  description: string;
}> = {
  verified: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    icon: Shield,
    label: 'Verificada',
    description: 'Esta cita fue verificada contra la base de conocimiento.',
  },
  suspicious: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: ShieldAlert,
    label: 'Sospechosa',
    description: 'Hay coincidencias parciales pero la metadata no concuerda totalmente.',
  },
  not_found: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: ShieldX,
    label: 'No encontrada',
    description: 'No se encontró esta cita en la base de conocimiento. Verifique manualmente.',
  },
  pending: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    icon: ShieldQuestion,
    label: 'Verificando...',
    description: 'La verificación de esta cita está en proceso.',
  },
};

export function CitationBadgeInline({
  reference,
  status,
  source,
  year,
  court,
  magistrate,
  textSnippet,
  sourceUrl,
}: CitationBadgeInlineProps) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  const copyReference = () => {
    navigator.clipboard.writeText(reference).then(() => {
      toast.success('Cita copiada al portapapeles');
    });
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Cita ${reference} (${cfg.label})`}
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 align-middle text-[11px] font-medium transition-all hover:scale-[1.02] ${cfg.bg} ${cfg.text}`}
        >
          <Icon size={11} aria-hidden />
          <span className="font-mono">{reference}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={6}
          align="start"
          className="z-50 max-w-[320px] rounded-lg border bg-white p-3 shadow-lg"
          style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
        >
          <div className="flex items-start gap-2">
            <div className={`shrink-0 rounded p-1.5 ${cfg.bg}`}>
              <Icon size={14} className={cfg.text} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[13px] font-semibold" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                {reference}
              </div>
              <div className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.text}`}>
                {cfg.label}
              </div>
            </div>
          </div>

          {/* Metadata si disponible */}
          {(court || year || magistrate || source) && (
            <dl className="mt-3 space-y-1 border-t pt-2 text-[11px]" style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}>
              {court && (
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--v2-text-tertiary,#807E76)]">Tribunal:</dt>
                  <dd className="text-right font-medium" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>{court}</dd>
                </div>
              )}
              {year && (
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--v2-text-tertiary,#807E76)]">Año:</dt>
                  <dd className="text-right font-medium tabular-nums" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>{year}</dd>
                </div>
              )}
              {magistrate && (
                <div className="flex justify-between gap-2">
                  <dt className="shrink-0 text-[var(--v2-text-tertiary,#807E76)]">M.P.:</dt>
                  <dd className="text-right font-medium" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>{magistrate}</dd>
                </div>
              )}
              {source && (
                <div className="flex justify-between gap-2">
                  <dt className="text-[var(--v2-text-tertiary,#807E76)]">Fuente:</dt>
                  <dd className="text-right font-mono text-[10px]" style={{ color: 'var(--v2-text-tertiary, #807E76)' }}>{source}</dd>
                </div>
              )}
            </dl>
          )}

          {textSnippet && (
            <blockquote
              className="mt-3 border-l-2 pl-2 text-[11px] italic"
              style={{
                borderColor: 'var(--v2-accent-copper, #B8763C)',
                color: 'var(--v2-text-secondary, #4A4944)',
              }}
            >
              &ldquo;{textSnippet}&rdquo;
            </blockquote>
          )}

          <p className="mt-3 text-[10px]" style={{ color: 'var(--v2-text-tertiary, #807E76)' }}>
            {cfg.description}
          </p>

          {/* Actions */}
          <div className="mt-3 flex items-center justify-end gap-2 border-t pt-2" style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}>
            <button
              type="button"
              onClick={copyReference}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
              style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
            >
              <Copy size={10} aria-hidden />
              Copiar
            </button>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
                style={{ color: 'var(--v2-brand-navy, #0E2A5E)' }}
              >
                <ExternalLink size={10} aria-hidden />
                Ver documento
              </a>
            )}
          </div>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
