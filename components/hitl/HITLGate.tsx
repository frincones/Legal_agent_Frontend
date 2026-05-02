'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Ic } from '@/components/atoms/icons';
import { cn } from '@/lib/utils';

export type HITLKind =
  | 'email_externo'
  | 'firma_digital'
  | 'cita_jurisprudencia'
  | 'accion_financiera'
  | 'sobrescribir'
  | 'escrito_juzgado'
  | 'dato_sensible_habeas_data';

const TONE: Record<HITLKind, 'amber' | 'danger' | 'blue'> = {
  email_externo: 'amber',
  firma_digital: 'danger',
  cita_jurisprudencia: 'blue',
  accion_financiera: 'amber',
  sobrescribir: 'amber',
  escrito_juzgado: 'amber',
  dato_sensible_habeas_data: 'blue',
};

const TITLE: Record<HITLKind, string> = {
  email_externo: 'Envío de email externo',
  firma_digital: 'Firma digital',
  cita_jurisprudencia: 'Cita en documento generado',
  accion_financiera: 'Acción financiera > $50M COP',
  sobrescribir: 'Sobrescribir documento del cliente',
  escrito_juzgado: 'Escrito a juez / contraparte',
  dato_sensible_habeas_data: 'Datos sensibles detectados',
};

export function HITLGate({
  open,
  kind,
  preview,
  onApprove,
  onEdit,
  onReject,
  onClose,
}: {
  open: boolean;
  kind: HITLKind;
  preview: Record<string, unknown>;
  onApprove: () => void;
  onEdit?: () => void;
  onReject: () => void;
  onClose: () => void;
}) {
  const tone = TONE[kind];
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 p-6 shadow-3 outline-none">
          <div className="mb-3 flex items-center gap-3">
            <span
              className={cn(
                'grid h-[36px] w-[36px] place-items-center rounded-md',
                tone === 'amber' && 'bg-warn-soft text-warn',
                tone === 'danger' && 'bg-danger-soft text-danger',
                tone === 'blue' && 'bg-accent-soft text-accent-ink',
              )}
            >
              {Ic.shield}
            </span>
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider muted">HITL gate</div>
              <h2 className="serif m-0 text-[18px] font-semibold -tracking-[0.005em]">{TITLE[kind]}</h2>
            </div>
            <span
              className={cn(
                'chip ml-auto',
                tone === 'amber' && 'chip-amber',
                tone === 'danger' && 'chip-red',
                tone === 'blue' && 'chip-blue',
              )}
            >
              Aprobación humana requerida
            </span>
          </div>

          <pre className="max-h-[240px] overflow-auto rounded-md bg-bg-sunken p-3 mono text-[11.5px] leading-snug">
            {JSON.stringify(preview, null, 2)}
          </pre>

          <div className="mt-4 flex gap-2">
            <button onClick={onReject} className="btn">
              Rechazar
            </button>
            {onEdit && (
              <button onClick={onEdit} className="btn">
                Editar
              </button>
            )}
            <button onClick={onApprove} className="btn btn-primary ml-auto">
              {Ic.check} Aprobar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
