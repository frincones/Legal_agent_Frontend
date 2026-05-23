'use client';

/**
 * components/v2/document-gen/SectionActions.tsx
 *
 * Toolbar flotante con acciones por seccion: regenerar, editar, lock, eliminar.
 * Se renderiza on-hover sobre cada SectionBlock completado.
 */

import { RefreshCw, Pencil, Lock, Unlock, Trash2, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export interface SectionActionsProps {
  sectionKey: string;
  sectionTitle: string;
  isLocked: boolean;
  isRegenerating?: boolean;
  isUserEdited?: boolean;
  onRegenerate?: (sectionKey: string) => void;
  onEdit?: (sectionKey: string) => void;
  onToggleLock?: (sectionKey: string) => void;
  onDelete?: (sectionKey: string) => void;
  onComment?: (sectionKey: string) => void;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
}

function ActionButton({ icon, label, shortcut, onClick, disabled, variant }: ActionButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colorClass = variant === 'destructive'
    ? 'text-red-600 hover:bg-red-50'
    : 'text-[var(--v2-text-secondary,#4A4944)] hover:bg-[var(--v2-bg-subtle,#F2F1EC)]';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={label}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${colorClass}`}
      >
        {icon}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--v2-text-primary,#1A1916)] px-2 py-1 text-[10px] font-medium text-white">
          {label}
          {shortcut && <span className="ml-1.5 opacity-60">{shortcut}</span>}
        </div>
      )}
    </div>
  );
}

export function SectionActions({
  sectionKey,
  sectionTitle: _sectionTitle,
  isLocked,
  isRegenerating = false,
  isUserEdited = false,
  onRegenerate,
  onEdit,
  onToggleLock,
  onDelete,
  onComment,
}: SectionActionsProps) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-md border bg-white px-1 py-0.5 shadow-sm"
      style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
    >
      {onRegenerate && (
        <ActionButton
          icon={<RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} aria-hidden />}
          label="Regenerar sección"
          shortcut="⌘R"
          onClick={() => onRegenerate(sectionKey)}
          disabled={isRegenerating || isLocked}
        />
      )}
      {onEdit && (
        <ActionButton
          icon={<Pencil size={13} aria-hidden />}
          label={isUserEdited ? 'Editar (modificada)' : 'Editar manualmente'}
          onClick={() => onEdit(sectionKey)}
          disabled={isRegenerating}
        />
      )}
      {onToggleLock && (
        <ActionButton
          icon={isLocked ? <Lock size={13} aria-hidden /> : <Unlock size={13} aria-hidden />}
          label={isLocked ? 'Desbloquear sección' : 'Bloquear sección (proteger del agente)'}
          shortcut="⌘L"
          onClick={() => onToggleLock(sectionKey)}
        />
      )}
      {onComment && (
        <ActionButton
          icon={<MessageSquare size={13} aria-hidden />}
          label="Comentar"
          onClick={() => onComment(sectionKey)}
        />
      )}
      {onDelete && (
        <ActionButton
          icon={<Trash2 size={13} aria-hidden />}
          label="Eliminar sección"
          onClick={() => onDelete(sectionKey)}
          variant="destructive"
          disabled={isRegenerating || isLocked}
        />
      )}
    </div>
  );
}
