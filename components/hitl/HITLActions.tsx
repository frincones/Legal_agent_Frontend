'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';

type Decision = 'approved' | 'edited' | 'rejected';

/**
 * Inline action buttons for a single HITL pending item in the inbox.
 *
 * - Approve: directly POSTs decision='approved'
 * - Edit:    opens a JSON editor preloaded with the payload, posts
 *            decision='edited' with the modified payload
 * - Reject:  opens a small modal asking for an optional reason, posts
 *            decision='rejected' with reason in decision_payload.notes
 *
 * After every successful decision we hide the row optimistically and
 * call router.refresh() to re-fetch the RSC list.
 */
export function HITLActions({
  id,
  payload,
  size = 'sm',
}: {
  id: string;
  payload: Record<string, unknown>;
  size?: 'sm' | 'md';
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editValue, setEditValue] = useState<string>(() =>
    JSON.stringify(payload ?? {}, null, 2),
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [reason, setReason] = useState<string>('');

  const submit = useCallback(
    async (decision: Decision, decision_payload?: unknown) => {
      if (busy) return;
      setBusy(true);
      try {
        const res = await fetch(`/api/hitl/${encodeURIComponent(id)}/decide`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ decision, decision_payload }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text.slice(0, 160) || `Error ${res.status}`);
        }
        toast.success(
          decision === 'approved'
            ? 'Aprobado'
            : decision === 'edited'
              ? 'Editado y aprobado'
              : 'Rechazado',
        );
        setHidden(true);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error registrando decisión';
        toast.error(msg);
      } finally {
        setBusy(false);
      }
    },
    [busy, id, router],
  );

  const onApprove = useCallback(() => void submit('approved'), [submit]);
  const onEditOpen = useCallback(() => {
    setEditValue(JSON.stringify(payload ?? {}, null, 2));
    setEditError(null);
    setEditOpen(true);
  }, [payload]);
  const onEditConfirm = useCallback(() => {
    try {
      const parsed = JSON.parse(editValue);
      setEditOpen(false);
      void submit('edited', parsed);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'JSON inválido');
    }
  }, [editValue, submit]);
  const onRejectOpen = useCallback(() => {
    setReason('');
    setRejectOpen(true);
  }, []);
  const onRejectConfirm = useCallback(() => {
    setRejectOpen(false);
    void submit('rejected', reason ? { notes: reason } : undefined);
  }, [reason, submit]);

  if (hidden) return null;

  const btn = size === 'sm' ? 'btn btn-sm' : 'btn';

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          className={btn}
          onClick={onRejectOpen}
          disabled={busy}
          aria-label="Rechazar"
        >
          Rechazar
        </button>
        <button
          type="button"
          className={btn}
          onClick={onEditOpen}
          disabled={busy}
          aria-label="Editar payload"
        >
          Editar
        </button>
        <button
          type="button"
          className={`${btn} btn-primary`}
          onClick={onApprove}
          disabled={busy}
          aria-label="Aprobar"
        >
          {Ic.check} Aprobar
        </button>
      </div>

      {/* Edit dialog */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
          <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 p-6 shadow-3 outline-none">
            <Dialog.Title className="serif text-[18px] font-semibold">
              Editar payload antes de aprobar
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-[12px] muted">
              Ajusta el JSON; al confirmar se aprobará con los cambios.
            </Dialog.Description>
            <textarea
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                setEditError(null);
              }}
              spellCheck={false}
              className="mono mt-3 h-[260px] w-full resize-y rounded-md border border-line bg-bg-sunken p-3 text-[12px] leading-snug outline-none focus:border-accent"
              aria-label="Payload editable"
            />
            {editError && (
              <div className="mt-2 text-[11.5px] text-danger">JSON inválido: {editError}</div>
            )}
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn" onClick={() => setEditOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary ml-auto"
                onClick={onEditConfirm}
                disabled={busy}
              >
                Confirmar y aprobar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Reject dialog */}
      <Dialog.Root open={rejectOpen} onOpenChange={setRejectOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
          <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(480px,92vw)] -translate-x-1/2 -translate-y-1/2 p-6 shadow-3 outline-none">
            <Dialog.Title className="serif text-[18px] font-semibold">
              Rechazar acción
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-[12px] muted">
              ¿Por qué la rechazas? (opcional, pero ayuda al agente a aprender).
            </Dialog.Description>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: la cita está derogada / falta firma del cliente / monto incorrecto."
              className="mt-3 h-[120px] w-full resize-y rounded-md border border-line bg-bg-elev p-3 text-[13px] outline-none focus:border-accent"
              aria-label="Razón del rechazo"
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn" onClick={() => setRejectOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary ml-auto"
                onClick={onRejectConfirm}
                disabled={busy}
              >
                Rechazar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
