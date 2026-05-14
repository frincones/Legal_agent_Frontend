'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Bell, Ban, CheckCircle2, Copy, ExternalLink, FileSignature,
  Loader2, RefreshCcw, X, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Signer = {
  id: string; name: string; email: string | null; role: string;
  sort_order: number; auth_method: string; status: string;
  signed_at: string | null; signed_ip: string | null;
  decline_reason: string | null; signing_url: string | null;
  reminder_sent_count: number;
};

type DocItem = {
  id: string; filename: string; pages: number | null; position: number;
};

type Event = {
  id: string; kind: string; actor: string | null;
  occurred_at: string | null;
};

export function EnvelopeDetail({
  envelopeId,
  onClose,
}: {
  envelopeId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/signatures/envelopes/${envelopeId}`, { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [envelopeId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function action(verb: 'send' | 'cancel' | 'remind') {
    setBusy(true);
    try {
      const r = await fetch(`/api/signatures/envelopes/${envelopeId}/${verb}`, { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      if (verb === 'send' && d.signing_urls) {
        toast.success(`Enviado · ${d.configured ? 'provider real' : 'modo demo'}`);
      } else {
        toast.success(verb === 'cancel' ? 'Sobre cancelado' : 'Recordatorio enviado');
      }
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
    }
  }

  function copyURL(url: string) {
    navigator.clipboard.writeText(window.location.origin + url).then(() => toast.success('URL copiada'));
  }

  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-screen w-[640px] max-w-[95vw] overflow-y-auto border-l border-line bg-bg p-5">
          <div className="flex items-start justify-between">
            <Dialog.Title className="serif text-[18px] font-semibold inline-flex items-center gap-2">
              <FileSignature size={18} className="text-accent" aria-hidden="true" />
              {loading || !data ? 'Cargando…' : data.envelope.title}
            </Dialog.Title>
            <button className="btn" onClick={onClose}><X size={14} aria-hidden="true" /></button>
          </div>

          {loading || !data ? (
            <div className="mt-6 flex items-center gap-2 text-[12.5px] muted">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <Cell label="Provider" v={<span className="capitalize">{data.envelope.provider}</span>} />
                <Cell label="Estado" v={<span className="capitalize">{data.envelope.status}</span>} />
                <Cell label="Firmantes" v={`${data.envelope.signed_count}/${data.envelope.signer_count}`} />
                <Cell label="Enviado" v={data.envelope.sent_at ? formatRelative(data.envelope.sent_at) : '—'} />
                <Cell label="Expira" v={data.envelope.expires_at ? formatRelative(data.envelope.expires_at) : '—'} />
                <Cell label="Completado" v={data.envelope.completed_at ? formatRelative(data.envelope.completed_at) : '—'} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {data.envelope.status === 'draft' && (
                  <button className="btn btn-primary" onClick={() => action('send')} disabled={busy}>
                    {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : null}
                    Enviar a firmantes
                  </button>
                )}
                {(['sent', 'viewed', 'partially_signed'].includes(data.envelope.status)) && (
                  <>
                    <button className="btn" onClick={() => action('remind')} disabled={busy}>
                      <Bell size={11} aria-hidden="true" /> Recordar
                    </button>
                    <button className="btn" onClick={() => action('cancel')} disabled={busy}>
                      <Ban size={11} aria-hidden="true" /> Cancelar
                    </button>
                  </>
                )}
                <button className="btn ml-auto" onClick={refresh}>
                  <RefreshCcw size={11} aria-hidden="true" /> Refrescar
                </button>
              </div>

              <section className="mt-5">
                <h3 className="mb-1 text-[11px] uppercase tracking-wider muted">Firmantes</h3>
                <ul className="grid gap-1.5">
                  {data.signers.map((s: Signer) => (
                    <li key={s.id} className="rounded-md border border-line bg-bg-elev p-2 text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[10.5px] muted">— {s.role}</span>
                        <span className={cn(
                          'ml-auto inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                          s.status === 'signed' && 'border-emerald-500/40 text-emerald-500',
                          s.status === 'pending' && 'border-line text-ink-3',
                          s.status === 'sent' && 'border-blue-500/40 text-blue-500',
                          s.status === 'viewed' && 'border-blue-500/40 text-blue-500',
                          s.status === 'declined' && 'border-red-500/40 text-red-500',
                        )}>
                          {s.status === 'signed' ? <CheckCircle2 size={10} aria-hidden="true" /> :
                           s.status === 'declined' ? <XCircle size={10} aria-hidden="true" /> : null}
                          {s.status}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] muted">
                        <span>{s.email || '—'}</span>
                        {s.signed_at && <span>· firmó {formatRelative(s.signed_at)}</span>}
                        {s.reminder_sent_count > 0 && <span>· {s.reminder_sent_count} recordatorios</span>}
                      </div>
                      {s.signing_url && (
                        <div className="mt-1 flex items-center gap-1">
                          <code className="flex-1 truncate rounded bg-bg p-1 text-[10.5px] mono">{s.signing_url}</code>
                          <button className="btn" onClick={() => copyURL(s.signing_url!)}>
                            <Copy size={10} aria-hidden="true" />
                          </button>
                          <a href={s.signing_url} target="_blank" rel="noopener" className="btn">
                            <ExternalLink size={10} aria-hidden="true" />
                          </a>
                        </div>
                      )}
                      {s.decline_reason && (
                        <div className="mt-1 text-[11px] text-red-500">Rechazó: {s.decline_reason}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-4">
                <h3 className="mb-1 text-[11px] uppercase tracking-wider muted">Documentos</h3>
                <ul className="grid gap-1">
                  {data.documents.map((d: DocItem) => (
                    <li key={d.id} className="rounded-md border border-line bg-bg-elev p-2 text-[12px]">
                      <span className="font-semibold">{d.filename}</span>
                      {d.pages && <span className="ml-2 text-[10.5px] muted">{d.pages} págs</span>}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-4">
                <h3 className="mb-1 text-[11px] uppercase tracking-wider muted">Audit log ({data.events.length})</h3>
                <ul className="grid gap-1 text-[11.5px]">
                  {data.events.map((e: Event) => (
                    <li key={e.id} className="flex items-center gap-2 border-b border-line/40 pb-1">
                      <span className="muted whitespace-nowrap">{e.occurred_at && formatRelative(e.occurred_at)}</span>
                      <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold">{e.kind}</span>
                      <span className="muted truncate">{e.actor}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Cell({ label, v }: { label: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-bg-elev p-2">
      <div className="text-[10.5px] uppercase tracking-wider muted">{label}</div>
      <div className="mt-0.5 truncate">{v}</div>
    </div>
  );
}
