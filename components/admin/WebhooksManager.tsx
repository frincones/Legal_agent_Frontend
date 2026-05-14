'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlertTriangle, CheckCircle2, Copy, Loader2, Plus, Power, RefreshCcw,
  Send, Trash2, Webhook, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Webhook = {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  last_delivery_at: string | null;
  last_status_code: number | null;
  success_count: number;
  failure_count: number;
  created_at: string;
};

type WebhookEvent = { name: string; description: string };

export function WebhooksManager() {
  const [items, setItems] = useState<Webhook[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openDeliveries, setOpenDeliveries] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [w, e] = await Promise.all([
        fetch('/api/webhooks', { cache: 'no-store' }),
        fetch('/api/webhooks/events', { cache: 'no-store' }),
      ]);
      if (w.ok) setItems((await w.json()).items || []);
      if (e.ok) setEvents((await e.json()).events || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function toggleActive(w: Webhook) {
    const r = await fetch(`/api/webhooks/${w.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active: !w.active }),
    });
    if (r.ok) { toast.success(w.active ? 'Pausado' : 'Activado'); void refresh(); }
  }

  async function del(w: Webhook) {
    if (!confirm(`¿Eliminar webhook "${w.name}"?`)) return;
    const r = await fetch(`/api/webhooks/${w.id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Eliminado'); void refresh(); }
  }

  async function sendTest(w: Webhook) {
    const r = await fetch(`/api/webhooks/${w.id}/test`, { method: 'POST' });
    if (r.ok) {
      const d = await r.json();
      toast.success(`Test enviado · ${d.dispatch.sent ?? 0}/${d.dispatch.processed ?? 0} OK`);
      void refresh();
    }
  }

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="serif text-[16px] font-semibold">Webhooks salientes</h2>
          <p className="text-[12px] muted">
            Notifica a sistemas externos cuando algo pasa en LexAI (Zapier/Make/tu app).
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={refresh}>
            <RefreshCcw size={12} aria-hidden="true" /> Refrescar
          </button>
          <button className="btn btn-primary" onClick={() => setOpenCreate(true)}>
            <Plus size={14} aria-hidden="true" /> Nuevo webhook
          </button>
        </div>
      </header>

      {loading ? (
        <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="surface p-6 text-center text-[12.5px] muted">
          Sin webhooks. Crea uno para empezar a recibir notificaciones.
        </div>
      ) : (
        <div className="surface overflow-x-auto p-2">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                <th className="py-2">Nombre</th>
                <th className="py-2">URL</th>
                <th className="py-2">Eventos</th>
                <th className="py-2 text-right">OK</th>
                <th className="py-2 text-right">Fail</th>
                <th className="py-2">Último</th>
                <th className="py-2">Estado</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id} className="border-t border-line text-[12.5px]">
                  <td className="py-2.5 font-semibold">
                    <Webhook size={12} className="mr-1 inline text-accent" aria-hidden="true" /> {w.name}
                  </td>
                  <td className="py-2.5 mono text-[11px] truncate max-w-[260px]">{w.url}</td>
                  <td className="py-2.5">
                    <span className="text-[10.5px] muted">{w.events.length} evento{w.events.length !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="py-2.5 text-right mono text-emerald-500">{w.success_count}</td>
                  <td className="py-2.5 text-right mono text-red-500">{w.failure_count}</td>
                  <td className="py-2.5 muted">
                    {w.last_delivery_at ? formatRelative(w.last_delivery_at) : '—'}
                    {w.last_status_code && (
                      <span className="ml-1 text-[10.5px]">({w.last_status_code})</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <button onClick={() => toggleActive(w)} title={w.active ? 'Pausar' : 'Activar'}>
                      <Power size={14} className={w.active ? 'text-emerald-500' : 'text-ink-3'} aria-hidden="true" />
                    </button>
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button className="btn" onClick={() => sendTest(w)} title="Enviar ping de prueba">
                        <Send size={11} aria-hidden="true" />
                      </button>
                      <button className="btn" onClick={() => setOpenDeliveries(w.id)} title="Ver entregas">
                        Entregas
                      </button>
                      <button className="btn" onClick={() => del(w)} title="Eliminar">
                        <Trash2 size={11} className="text-red-500" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        events={events}
        onCreated={(secret) => { setCreatedSecret(secret); refresh(); }}
      />
      {openDeliveries && (
        <DeliveriesDialog webhookId={openDeliveries} onClose={() => setOpenDeliveries(null)} />
      )}
      {createdSecret && <SecretDialog secret={createdSecret} onClose={() => setCreatedSecret(null)} />}
    </div>
  );
}

function CreateDialog({
  open, onOpenChange, events, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  events: WebhookEvent[];
  onCreated: (secret: string) => void;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['all']);
  const [busy, setBusy] = useState(false);

  function toggle(e: string) {
    if (e === 'all') {
      setSelectedEvents(['all']);
      return;
    }
    setSelectedEvents((p) => {
      const filtered = p.filter((x) => x !== 'all');
      return filtered.includes(e) ? filtered.filter((x) => x !== e) : [...filtered, e];
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, url, events: selectedEvents, active: true }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success('Webhook creado');
      onCreated(d.secret);
      onOpenChange(false);
      setName(''); setUrl(''); setSelectedEvents(['all']);
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[94vw] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Nuevo webhook</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Nombre">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Notificar Zapier" className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="URL del endpoint">
              <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Eventos">
              <div className="max-h-[200px] overflow-y-auto">
                <div className="grid gap-1">
                  {events.map((e) => (
                    <label key={e.name} className="flex items-start gap-2 text-[12px]">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(e.name)}
                        onChange={() => toggle(e.name)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <code className="text-[11px] mono">{e.name}</code>
                        {e.description && <span className="ml-2 text-[11px] muted">{e.description}</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy || !name.trim() || !url.trim()}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Webhook size={12} aria-hidden="true" />}
                Crear
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SecretDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  function copy() {
    navigator.clipboard.writeText(secret).then(() => toast.success('Copiado'));
  }
  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[480px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 surface border-amber-500/40 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" aria-hidden="true" />
            <Dialog.Title className="serif text-[16px] font-semibold">Guarda el secret HMAC</Dialog.Title>
          </div>
          <p className="mt-2 text-[12.5px] muted">
            Tu endpoint receptor debe validar el header <code>X-LexAI-Signature</code> usando este secret.
            Solo se muestra esta vez.
          </p>
          <div className="mt-3 rounded border border-line bg-bg-elev p-3">
            <code className="text-[11px] mono break-all">{secret}</code>
          </div>
          <p className="mt-3 text-[11px] muted">
            Algoritmo: <code>sha256=&lt;HMAC-SHA256(secret, body)&gt;</code>. Headers también incluyen{' '}
            <code>X-LexAI-Event</code>, <code>X-LexAI-Event-Id</code> y <code>X-LexAI-Timestamp</code>.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn" onClick={copy}><Copy size={12} aria-hidden="true" /> Copiar</button>
            <button className="btn btn-primary" onClick={onClose}>Ya lo copié</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeliveriesDialog({ webhookId, onClose }: { webhookId: string; onClose: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/webhooks/${webhookId}/deliveries?limit=100`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [webhookId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[760px] max-w-[96vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[17px] font-semibold">Entregas recientes</Dialog.Title>
          {loading ? (
            <div className="mt-3 flex items-center gap-2 text-[12.5px] muted">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
            </div>
          ) : (
            <table className="mt-3 w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                  <th className="py-2">Cuándo</th>
                  <th className="py-2">Evento</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2 text-right">HTTP</th>
                  <th className="py-2 text-right">Intentos</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-t border-line">
                    <td className="py-1.5 muted">{d.created_at && formatRelative(d.created_at)}</td>
                    <td className="py-1.5 mono">{d.event_type}</td>
                    <td className="py-1.5">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[10.5px]',
                        d.status === 'succeeded' && 'text-emerald-500',
                        d.status === 'failed' && 'text-red-500',
                        d.status === 'retrying' && 'text-amber-500',
                        d.status === 'pending' && 'text-ink-3',
                      )}>
                        {d.status === 'succeeded' ? <CheckCircle2 size={10} aria-hidden="true" /> :
                         d.status === 'failed' ? <XCircle size={10} aria-hidden="true" /> : null}
                        {d.status}
                      </span>
                    </td>
                    <td className="py-1.5 text-right mono">{d.status_code || '—'}</td>
                    <td className="py-1.5 text-right mono">{d.attempt_count}/{d.max_attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wider muted">{label}</label>
      <div className="rounded-md border border-line bg-bg-elev p-[10px] text-[13px] focus-within:border-accent">{children}</div>
    </div>
  );
}
