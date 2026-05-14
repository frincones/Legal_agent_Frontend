'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Plus, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

type Provider = { kind: string; label: string; configured: boolean; description: string };
type Doc = { id: string; titulo: string; matter_id: string | null };
type Matter = { id: string; titulo: string };

type Signer = {
  role: string;
  name: string;
  email: string;
  phone: string;
  identity_id: string;
  auth_method: 'email' | 'sms' | 'otp' | 'biometric' | 'none';
};

export function EnvelopeWizard({
  open,
  onOpenChange,
  onCreated,
  preselectedDocumentIds,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
  preselectedDocumentIds?: string[];
}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [provider, setProvider] = useState('demo');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [matterId, setMatterId] = useState('');
  const [signerOrder, setSignerOrder] = useState<'parallel' | 'sequential'>('parallel');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [signers, setSigners] = useState<Signer[]>([
    { role: 'firmante', name: '', email: '', phone: '', identity_id: '', auth_method: 'email' },
  ]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(preselectedDocumentIds || []);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [busy, setBusy] = useState(false);
  const [busySend, setBusySend] = useState(false);

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      fetch('/api/signatures/providers', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
      fetch('/api/matters?limit=200', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
    ]).then(([p, m]) => {
      if (p) setProviders(p.items || []);
      if (m) {
        setMatters((m.items || []).map((x: any) => ({ id: x.id, titulo: x.titulo })));
      }
    }).catch(() => {});
  }, [open]);

  // Cargar docs cuando se selecciona un matter
  useEffect(() => {
    if (!matterId) {
      setDocs([]);
      return;
    }
    fetch(`/api/matter-documents?matter_id=${matterId}`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) setDocs((d.items || []).map((x: any) => ({
          id: x.id, titulo: x.titulo, matter_id: x.matter_id,
        })));
      })
      .catch(() => {});
  }, [matterId]);

  function addSigner() {
    setSigners((p) => [
      ...p,
      { role: 'firmante', name: '', email: '', phone: '', identity_id: '', auth_method: 'email' },
    ]);
  }

  function updateSigner(i: number, patch: Partial<Signer>) {
    setSigners((p) => p.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }

  function removeSigner(i: number) {
    setSigners((p) => p.filter((_, idx) => idx !== i));
  }

  function toggleDoc(id: string) {
    setSelectedDocs((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function submit(send: boolean) {
    if (!title.trim() || signers.length === 0 || selectedDocs.length === 0) {
      toast.error('Faltan campos · título, al menos 1 firmante y 1 documento');
      return;
    }
    if (signers.some((s) => !s.name.trim())) {
      toast.error('Cada firmante necesita un nombre');
      return;
    }
    setBusy(true);
    try {
      const docsPayload = docs
        .filter((d) => selectedDocs.includes(d.id))
        .map((d, i) => ({
          source_document_id: d.id,
          filename: d.titulo,
          position: i,
        }));
      const r = await fetch('/api/signatures/envelopes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title, message: message || null, provider, matter_id: matterId || null,
          signer_order: signerOrder, expires_in_days: expiresInDays,
          signers: signers.map((s, i) => ({
            ...s, sort_order: i,
            email: s.email || null, phone: s.phone || null, identity_id: s.identity_id || null,
          })),
          documents: docsPayload,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      if (send) {
        setBusySend(true);
        const sR = await fetch(`/api/signatures/envelopes/${d.id}/send`, { method: 'POST' });
        if (!sR.ok) throw new Error(await sR.text());
        const sD = await sR.json();
        toast.success(`Enviado · ${sD.configured ? 'provider real' : 'modo demo'}`);
      } else {
        toast.success('Sobre creado (draft)');
      }
      onCreated();
      onOpenChange(false);
      setTitle(''); setMessage(''); setMatterId('');
      setSigners([{ role: 'firmante', name: '', email: '', phone: '', identity_id: '', auth_method: 'email' }]);
      setSelectedDocs([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
      setBusySend(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[640px] max-w-[96vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <div className="flex items-center justify-between">
            <Dialog.Title className="serif text-[17px] font-semibold">Nuevo sobre de firma</Dialog.Title>
            <button className="btn" onClick={() => onOpenChange(false)}><X size={14} aria-hidden="true" /></button>
          </div>

          <div className="mt-4 grid gap-3">
            <Field label="Provider">
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full bg-transparent outline-none">
                {providers.map((p) => (
                  <option key={p.kind} value={p.kind} disabled={!p.configured && p.kind !== 'demo'}>
                    {p.label} {!p.configured && p.kind !== 'demo' ? '(no configurado)' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Título">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Firma contrato de servicios" className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Mensaje (opcional)">
              <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Caso (opcional)">
                <select value={matterId} onChange={(e) => setMatterId(e.target.value)} className="w-full bg-transparent outline-none">
                  <option value="">— sin caso —</option>
                  {matters.map((m) => (<option key={m.id} value={m.id}>{m.titulo}</option>))}
                </select>
              </Field>
              <Field label="Orden firmantes">
                <select value={signerOrder} onChange={(e) => setSignerOrder(e.target.value as 'parallel' | 'sequential')} className="w-full bg-transparent outline-none">
                  <option value="parallel">Paralelo (todos a la vez)</option>
                  <option value="sequential">Secuencial</option>
                </select>
              </Field>
            </div>
            <Field label="Expira en (días)">
              <input type="number" min={1} max={180} value={expiresInDays} onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)} className="w-full bg-transparent outline-none" />
            </Field>

            {/* Documentos */}
            <section className="rounded-md border border-line p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider muted">Documentos</span>
                <span className="text-[11px] muted">
                  {selectedDocs.length} seleccionado{selectedDocs.length !== 1 ? 's' : ''}
                </span>
              </div>
              {matterId ? (
                docs.length === 0 ? (
                  <p className="text-[12px] muted">El caso no tiene documentos. Sube uno primero.</p>
                ) : (
                  <ul className="grid gap-1">
                    {docs.map((d) => (
                      <li key={d.id} className="flex items-center gap-2 text-[12px]">
                        <input type="checkbox" checked={selectedDocs.includes(d.id)} onChange={() => toggleDoc(d.id)} />
                        <span className="truncate">{d.titulo}</span>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <p className="text-[12px] muted">Selecciona un caso para ver sus documentos.</p>
              )}
            </section>

            {/* Firmantes */}
            <section className="rounded-md border border-line p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider muted">Firmantes ({signers.length})</span>
                <button type="button" className="btn" onClick={addSigner}>
                  <Plus size={11} aria-hidden="true" /> Añadir
                </button>
              </div>
              <ul className="grid gap-2">
                {signers.map((s, i) => (
                  <li key={i} className="rounded border border-line bg-bg-elev p-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Nombre completo"
                        value={s.name}
                        onChange={(e) => updateSigner(i, { name: e.target.value })}
                        className="rounded border border-line bg-bg p-1.5 text-[12px] outline-none"
                      />
                      <input
                        type="email"
                        placeholder="email@ejemplo.com"
                        value={s.email}
                        onChange={(e) => updateSigner(i, { email: e.target.value })}
                        className="rounded border border-line bg-bg p-1.5 text-[12px] outline-none"
                      />
                      <input
                        placeholder="C.C. / NIT (opcional)"
                        value={s.identity_id}
                        onChange={(e) => updateSigner(i, { identity_id: e.target.value })}
                        className="rounded border border-line bg-bg p-1.5 text-[12px] outline-none"
                      />
                      <input
                        placeholder="Teléfono (opcional)"
                        value={s.phone}
                        onChange={(e) => updateSigner(i, { phone: e.target.value })}
                        className="rounded border border-line bg-bg p-1.5 text-[12px] outline-none"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <select
                        value={s.auth_method}
                        onChange={(e) => updateSigner(i, { auth_method: e.target.value as Signer['auth_method'] })}
                        className="rounded border border-line bg-bg p-1 text-[11px]"
                      >
                        <option value="email">Auth email</option>
                        <option value="sms">SMS</option>
                        <option value="otp">OTP</option>
                        <option value="biometric">Biométrica</option>
                        <option value="none">Sin auth</option>
                      </select>
                      {signers.length > 1 && (
                        <button type="button" className="btn" onClick={() => removeSigner(i)}>
                          <Trash2 size={10} className="text-red-500" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button type="button" className="btn" onClick={() => submit(false)} disabled={busy}>
              {busy && !busySend ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : null}
              Guardar borrador
            </button>
            <button type="button" className="btn btn-primary" onClick={() => submit(true)} disabled={busy}>
              {busySend ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Send size={12} aria-hidden="true" />}
              Crear + Enviar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wider muted">{label}</label>
      <div className="rounded-md border border-line bg-bg-elev p-[8px_10px] text-[13px] focus-within:border-accent">{children}</div>
    </div>
  );
}
