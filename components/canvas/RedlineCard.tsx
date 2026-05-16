'use client';

/**
 * Sprint E · RedlineCard
 *
 * Card individual de un redline · muestra original + suggested + reason.
 * Acciones: Accept (verde) / Reject (rojo).
 */

import { Check, X, AlertCircle, FileText } from 'lucide-react';

export type Redline = {
  id: string;
  type: 'deletion' | 'insertion' | 'replacement';
  start: number;
  end: number;
  original?: string | null;
  suggested?: string | null;
  reason?: string | null;
  severity?: 'green' | 'yellow' | 'red' | 'info';
  citation?: string | null;
  status?: 'pending' | 'accepted' | 'rejected';
};

const SEVERITY_COLOR: Record<string, string> = {
  red: 'border-l-danger',
  yellow: 'border-l-warn',
  green: 'border-l-ok',
  info: 'border-l-accent',
};

const TYPE_LABEL: Record<string, string> = {
  deletion: 'Eliminar',
  insertion: 'Insertar',
  replacement: 'Reemplazar',
};

export function RedlineCard({
  redline,
  onAccept,
  onReject,
  disabled,
}: {
  redline: Redline;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  disabled?: boolean;
}) {
  const sev = redline.severity || 'info';
  const isApplied = redline.status === 'accepted';
  const isRejected = redline.status === 'rejected';
  const isFinal = isApplied || isRejected;

  return (
    <div
      className={`surface border-l-4 ${SEVERITY_COLOR[sev]} p-3 grid gap-2 ${
        isFinal ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="chip text-[10.5px]">{TYPE_LABEL[redline.type]}</span>
          {redline.severity && (
            <span className={`chip text-[10.5px] chip-${sev === 'green' ? 'green' : sev === 'yellow' ? 'amber' : sev === 'red' ? 'red' : 'blue'}`}>
              {sev.toUpperCase()}
            </span>
          )}
          {isApplied && <span className="chip chip-green text-[10px]">✓ Aplicado</span>}
          {isRejected && <span className="chip text-[10px]">✕ Rechazado</span>}
        </div>
      </div>

      {redline.original && (
        <div className="text-[11.5px]">
          <div className="muted mb-0.5">Original:</div>
          <div className="bg-danger-soft/30 line-through text-ink-2 px-2 py-1 rounded">
            {redline.original}
          </div>
        </div>
      )}

      {redline.suggested && (
        <div className="text-[11.5px]">
          <div className="muted mb-0.5">Sugerido:</div>
          <div className="bg-ok-soft/30 px-2 py-1 rounded">{redline.suggested}</div>
        </div>
      )}

      {redline.reason && (
        <div className="flex items-start gap-1.5 text-[11.5px] muted">
          <AlertCircle size={11} className="flex-none mt-0.5" />
          <span>{redline.reason}</span>
        </div>
      )}

      {redline.citation && (
        <div className="flex items-center gap-1.5 text-[11px] text-accent">
          <FileText size={10} />
          <span className="mono">{redline.citation}</span>
        </div>
      )}

      {!isFinal && (
        <div className="flex gap-1 mt-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAccept?.(redline.id)}
            className="btn btn-sm flex-1 text-ok"
            title="Aceptar redline"
          >
            <Check size={12} /> Aceptar
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onReject?.(redline.id)}
            className="btn btn-sm flex-1 text-danger"
            title="Rechazar redline"
          >
            <X size={12} /> Rechazar
          </button>
        </div>
      )}
    </div>
  );
}
