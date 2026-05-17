'use client';

/**
 * ActionCard — inline microinteraction proposed by the agent.
 *
 * Renders an "AI suggested action" inside the thread with 1-click approval
 * (or higher friction for destructive operations · see ActionCardData.approval).
 *
 * The actual execution is delegated to the parent via onApprove · this
 * component only handles UI state (pending / executing / done / dismissed).
 */

import { useState } from 'react';
import type { ActionCardData } from '@/lib/assistant/types';

interface ActionCardProps {
  action: ActionCardData;
  onApprove: () => void | Promise<void>;
  onDismiss: () => void;
  onSeeDetail?: () => void;
}

const KIND_LABEL: Record<string, string> = {
  add_deadline: 'Agregar plazo',
  cite_norm: 'Citar norma',
  open_document: 'Abrir documento',
  create_note: 'Crear nota',
  send_email: 'Enviar correo',
  sign_document: 'Firmar documento',
  archive_matter: 'Archivar caso',
  generate_document: 'Generar documento',
  custom: 'Acción',
};

const KIND_GLYPH: Record<string, string> = {
  add_deadline: '📅',
  cite_norm: '📚',
  open_document: '📄',
  create_note: '📝',
  send_email: '✉️',
  sign_document: '✍️',
  archive_matter: '📦',
  generate_document: '⚡',
  custom: '✨',
};

export function ActionCard({ action, onApprove, onDismiss, onSeeDetail }: ActionCardProps) {
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isDone = action.status === 'done';
  const isExecuting = action.status === 'executing';
  const isDismissed = action.status === 'dismissed';
  const isError = action.status === 'error';

  const handlePrimary = async () => {
    // Friction by approval level.
    if (action.approval === 'confirm' || action.approval === 'double_confirm') {
      if (!showConfirm) {
        setShowConfirm(true);
        return;
      }
    }
    setBusy(true);
    try {
      await onApprove();
    } finally {
      setBusy(false);
    }
  };

  const ctaLabel = (() => {
    if (isDone) return 'Hecho';
    if (isExecuting || busy) return 'Ejecutando…';
    if (isError) return 'Reintentar';
    if (showConfirm && action.approval === 'double_confirm') return 'Confirmar (irreversible)';
    if (showConfirm) return 'Confirmar';
    return 'Hacerlo';
  })();

  const glyph = KIND_GLYPH[action.kind] ?? '✨';
  const kindLabel = KIND_LABEL[action.kind] ?? action.kind;

  return (
    <div
      className={[
        'border-line bg-bg-elev rounded-md border p-3',
        isDone ? 'opacity-60' : '',
        isDismissed ? 'opacity-50' : '',
      ].join(' ')}
      role="region"
      aria-label={`Acción sugerida: ${action.title}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="text-lg leading-none" aria-hidden>
            {glyph}
          </span>
          <div className="min-w-0">
            <div className="text-ink-3 text-[10px] uppercase tracking-wide">
              Acción sugerida · {kindLabel}
            </div>
            <div className="text-ink mt-0.5 text-sm font-medium leading-tight">
              {action.title}
            </div>
            {action.description && (
              <div className="text-ink-2 mt-1 text-xs leading-snug">
                {action.description}
              </div>
            )}
          </div>
        </div>
      </div>

      {action.resultPreview && isDone && (
        <div className="bg-bg-sunken text-ink-2 mb-2 rounded-sm p-2 text-xs">
          {action.resultPreview}
        </div>
      )}

      {!isDismissed && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrimary}
            disabled={busy || isExecuting || isDone}
            className={[
              'rounded-sm px-2 py-1 text-xs font-medium transition-colors',
              isDone
                ? 'bg-ok-soft text-ok cursor-default'
                : isError
                ? 'bg-danger text-bg hover:opacity-90'
                : 'bg-accent text-bg hover:opacity-90',
              'disabled:cursor-not-allowed disabled:opacity-50',
            ].join(' ')}
          >
            {isDone ? `✓ ${ctaLabel}` : ctaLabel}
          </button>
          {onSeeDetail && !isDone && (
            <button
              type="button"
              onClick={onSeeDetail}
              className="text-ink-2 hover:bg-bg-sunken hover:text-ink rounded-sm px-2 py-1 text-xs"
            >
              👁 Ver detalle
            </button>
          )}
          {!isDone && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-ink-3 hover:text-ink ml-auto rounded-sm px-2 py-1 text-xs"
              aria-label="Descartar"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {isError && (
        <div className="bg-danger-soft text-danger mt-2 rounded-sm p-2 text-xs">
          Algo falló al ejecutar la acción. Revisa la actividad.
        </div>
      )}
    </div>
  );
}
