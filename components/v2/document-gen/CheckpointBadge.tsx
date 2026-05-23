'use client';

/**
 * components/v2/document-gen/CheckpointBadge.tsx
 *
 * Badge flotante que muestra checkpoint mas reciente + boton revertir.
 * Se renderiza en una esquina del canvas cuando hay checkpoints disponibles.
 */

import { useEffect, useState } from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { checkpointManager, type Checkpoint } from '@/lib/v2/document-gen/checkpointManager';

export interface CheckpointBadgeProps {
  docId: string;
  onRestore: (checkpoint: Checkpoint) => void;
}

function formatAge(timestamp: number): string {
  const sec = Math.floor((Date.now() - timestamp) / 1000);
  if (sec < 60) return `hace ${sec}s`;
  if (sec < 3600) return `hace ${Math.floor(sec / 60)}min`;
  if (sec < 86400) return `hace ${Math.floor(sec / 3600)}h`;
  return `hace ${Math.floor(sec / 86400)}d`;
}

const REASON_LABELS: Record<Checkpoint['triggerReason'], string> = {
  pre_regenerate: 'antes de regenerar',
  pre_replace: 'antes de reemplazar',
  pre_critique: 'antes de crítica',
  manual: 'manual',
  auto_periodic: 'automático',
};

export function CheckpointBadge({ docId, onRestore }: CheckpointBadgeProps) {
  const [latest, setLatest] = useState<Checkpoint | null>(null);
  const [, setTick] = useState(0);

  // Re-leer checkpoints periodicamente y forzar re-render del badge "hace X"
  useEffect(() => {
    const refresh = () => setLatest(checkpointManager.latest(docId));
    refresh();
    const id = setInterval(() => {
      refresh();
      setTick((t) => t + 1);
    }, 30_000);

    // Listener para evento custom cuando se crea nuevo checkpoint
    const handler = () => refresh();
    window.addEventListener('lexai:checkpoint-saved', handler);

    return () => {
      clearInterval(id);
      window.removeEventListener('lexai:checkpoint-saved', handler);
    };
  }, [docId]);

  if (!latest) return null;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 shadow-sm"
      style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
      role="status"
      aria-label="Checkpoint disponible"
    >
      <Clock size={12} className="text-[var(--v2-text-tertiary,#807E76)]" aria-hidden />
      <span className="text-[11px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
        Guardado {formatAge(latest.timestamp)}
        <span className="ml-1 text-[var(--v2-text-tertiary,#807E76)]">({REASON_LABELS[latest.triggerReason]})</span>
      </span>
      <button
        type="button"
        onClick={() => onRestore(latest)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
        style={{ color: 'var(--v2-brand-navy, #0E2A5E)' }}
      >
        <RotateCcw size={11} aria-hidden />
        Revertir
      </button>
    </div>
  );
}
