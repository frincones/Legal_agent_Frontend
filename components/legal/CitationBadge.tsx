'use client';

import { CheckCircle2, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Citation status badges — visual signal of trustability for each
 * citation in the document.
 *
 * Backend status mapping (backend/api/citations.py):
 *   verificada    → 'verified'    🟢 cita y norma vigente
 *   superada      → 'outdated'    🔴 derogada / superada
 *   sospechosa    → 'pending'     🟡 dudosa, requiere revisión
 *   no_encontrada → 'unverifiable'⚫ no encontrada en fuentes oficiales
 */

export type CitationStatus = 'verified' | 'outdated' | 'pending' | 'unverifiable';

const META: Record<
  CitationStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  verified: {
    label: 'Verificada',
    icon: CheckCircle2,
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  outdated: {
    label: 'Derogada',
    icon: AlertTriangle,
    className: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  unverifiable: {
    label: 'No encontrada',
    icon: HelpCircle,
    className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
  },
};

export function CitationBadge({
  status,
  size = 'sm',
  showLabel = true,
  className,
}: {
  status: CitationStatus;
  size?: 'xs' | 'sm';
  showLabel?: boolean;
  className?: string;
}) {
  const meta = META[status];
  const Icon = meta.icon;
  const iconSize = size === 'xs' ? 10 : 12;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-medium tabular-nums',
        size === 'xs' ? 'text-[9.5px]' : 'text-[10.5px]',
        meta.className,
        className,
      )}
      title={meta.label}
      aria-label={`Estado de cita: ${meta.label}`}
    >
      <Icon size={iconSize} className="flex-none" aria-hidden="true" />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}

/** Map raw backend status string → UI status. Defensive against
 *  unknown values from older API versions. */
export function mapBackendStatus(estado: string | undefined | null): CitationStatus {
  switch ((estado ?? '').toLowerCase()) {
    case 'verificada':
      return 'verified';
    case 'superada':
    case 'derogada':
    case 'modificada':
      return 'outdated';
    case 'sospechosa':
    case 'pendiente':
      return 'pending';
    case 'no_encontrada':
    case 'no_indexada':
    case '':
      return 'unverifiable';
    default:
      return 'unverifiable';
  }
}
