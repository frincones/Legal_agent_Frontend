'use client';

/**
 * Sprint D · DocuSignEnvelopeModal
 *
 * Modal para crear envelope DocuSign desde Canvas o desde un documento del caso.
 *
 * Modos:
 *   - source_document_id: doc ya en matter_documents
 *   - content_base64: bytes inline (Canvas export PDF)
 */

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FileSignature, Loader2, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

type SignerInput = {
  name: string;
  email: string;
  routing_order: number;
};

export function DocuSignEnvelopeModal({
  matterId,
  open,
  onOpenChange,
  // Una de estas dos:
  sourceDocumentId,
  contentBase64,
  documentName,
  defaultTitle,
  defaultSigners,
  onCreated,
}: {
  matterId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sourceDocumentId?: string;
  contentBase64?: string;
  documentName?: string;
  defaultTitle?: string;
  defaultSigners?: SignerInput[];
  onCreated?: (envelope: { id: string; envelope_id: string }) => void;
}) {
  const [title, setTitle] = useState(defaultTitle || '');
  const [message, setMessage] = useState('');
  const [signers, setSigners] = useState<SignerInput[]>(
    defaultSigners && defaultSigners.length > 0
      ? defaultSigners
      : [{ name: '', email: '', routing_order: 1 }]
  );
  const [submitting, setSubmitting] = useState(false);

  function updateSigner(i: number, field: keyof SignerInput, value: string | number) {
    const next = [...signers];
    (next[i] as any)[field] = value;
    setSigners(next);
  }
  function addSigner() {
    setSigners([...signers, { name: '', email: '', routing_order: signers.length + 1 }]);
  }
  function removeSigner(i: number) {
    setSigners(signers.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error('Indica un título'); return; }
    const validSigners = signers.filter(s => s.name.trim() && /.+@.+\..+/.test(s.email));
    if (validSigners.length === 0) {
      toast.error('Agrega al menos un firmante válido');
      return;
    }
    if (!sourceDocumentId && !contentBase64) {
      toast.error('Falta el documento a firmar');
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch('/api/docusign/envelopes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matter_id: matterId,
          title: title.trim(),
          message: message.trim() || '',
          signers: validSigners,
          source_document_id: sourceDocumentId,
          content_base64: contentBase64,
          document_name: documentName,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const msg = body?.detail?.message || body?.detail || `Error ${r.status}`;
        toast.error(typeof msg === 'string' ? msg : 'No pude crear el envelope');
        return;
      }
      const data = await r.json();
      toast.success(`Envelope enviado a ${validSigners.length} firmante(s)`);
      onCreated?.(data);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 surface p-6 max-h-[90vh] overflow-auto">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Dialog.Title className="serif text-[18px] font-semibold">
                Enviar a firma · DocuSign
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[12.5px] muted">
                Los firmantes recibirán email de DocuSign · firma legal vinculante.
              </Dialog.Description>
            </div>
            <Dialog.Close className="btn btn-sm"><X size={14} /></Dialog.Close>
          </div>

          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <label className="text-[12px] font-medium">Título del envelope *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contrato de honorarios · Tutela #4521"
                className="input mt-1 w-full"
                required
              />
            </div>

            <div>
              <label className="text-[12px] font-medium">Mensaje en el email</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={2}
                className="input mt-1 w-full resize-none"
                placeholder="Buen día, le envío el contrato para su firma..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-medium">Firmantes (orden secuencial)</label>
                <button type="button" onClick={addSigner} className="btn btn-sm">
                  <Plus size={12} /> Agregar
                </button>
              </div>
              <div className="grid gap-2">
                {signers.map((s, i) => (
                  <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                    <span className="chip text-[10.5px]">{s.routing_order}</span>
                    <input
                      value={s.name}
                      onChange={e => updateSigner(i, 'name', e.target.value)}
                      placeholder="Nombre del firmante"
                      className="input"
                      required
                    />
                    <input
                      type="email"
                      value={s.email}
                      onChange={e => updateSigner(i, 'email', e.target.value)}
                      placeholder="email@dominio.com"
                      className="input"
                      required
                    />
                    {signers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSigner(i)}
                        className="btn btn-sm"
                        title="Quitar firmante"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {documentName && (
              <p className="text-[11.5px] muted">
                Documento: <code>{documentName}</code>
              </p>
            )}

            <div className="mt-2 flex gap-2">
              <Dialog.Close className="btn flex-1" type="button">Cancelar</Dialog.Close>
              <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Enviando…</>
                ) : (
                  <><FileSignature size={14} /> Enviar a firma</>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
