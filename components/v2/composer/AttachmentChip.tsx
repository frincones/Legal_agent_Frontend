'use client';

/**
 * F3-T05 · LexAI UX v2 — AttachmentChip
 *
 * Pill pequeño que representa un attachment adjunto al composer antes de enviar.
 * Tipos: matter (caso), party (parte), judge (juez), deadline (plazo), doc (documento),
 *        skill (comando), connector (conector externo).
 *
 * Flag: NEXT_PUBLIC_UX_V2_COMPOSER
 */

import { X, Folder, User, Scale, Calendar, FilePlus2, Sparkles, Plug } from 'lucide-react';

export type AttachmentType =
  | 'matter'
  | 'party'
  | 'judge'
  | 'deadline'
  | 'doc'
  | 'skill'
  | 'connector';

export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string;
  /** Optional raw entity id (matter_id, party_id, etc.) */
  entityId?: string;
  /** Optional slug para conectores/skills */
  slug?: string;
}

interface AttachmentChipProps {
  attachment: Attachment;
  onRemove: (id: string) => void;
}

const TYPE_CONFIG: Record<
  AttachmentType,
  { icon: React.ElementType; colorClass: string; labelPrefix: string }
> = {
  matter: {
    icon: Folder,
    colorClass: 'bg-[color:var(--v2-brand-navy-soft,#E8EDF7)] text-[color:var(--v2-brand-navy,#0E2A5E)] border-[color:var(--v2-brand-navy,#0E2A5E)]/20',
    labelPrefix: 'Caso',
  },
  party: {
    icon: User,
    colorClass: 'bg-[color:var(--v2-accent-copper-soft,#F5EBE0)] text-[color:var(--v2-accent-copper,#B8763C)] border-[color:var(--v2-accent-copper,#B8763C)]/20',
    labelPrefix: 'Parte',
  },
  judge: {
    icon: Scale,
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
    labelPrefix: 'Juez',
  },
  deadline: {
    icon: Calendar,
    colorClass: 'bg-red-50 text-red-700 border-red-200',
    labelPrefix: 'Plazo',
  },
  doc: {
    icon: FilePlus2,
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    labelPrefix: 'Doc',
  },
  skill: {
    icon: Sparkles,
    colorClass: 'bg-purple-50 text-purple-700 border-purple-200',
    labelPrefix: 'Skill',
  },
  connector: {
    icon: Plug,
    colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
    labelPrefix: 'Conector',
  },
};

export function AttachmentChip({ attachment, onRemove }: AttachmentChipProps) {
  const config = TYPE_CONFIG[attachment.type];
  const Icon = config.icon;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'text-[11px] font-medium leading-none',
        'max-w-[160px]',
        config.colorClass,
      ].join(' ')}
      title={`${config.labelPrefix}: ${attachment.label}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{attachment.label}</span>
      <button
        type="button"
        onClick={() => onRemove(attachment.id)}
        aria-label={`Quitar ${config.labelPrefix} ${attachment.label}`}
        className="ml-0.5 shrink-0 rounded-full opacity-60 hover:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-current"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </span>
  );
}
