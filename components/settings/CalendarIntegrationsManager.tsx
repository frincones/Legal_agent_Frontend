'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, CheckCircle2, Loader2, Plus, RefreshCcw, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatRelative } from '@/lib/utils';

type Integration = {
  id: string;
  provider: 'google' | 'outlook';
  email_address: string;
  display_name: string | null;
  active: boolean;
  status: 'pending' | 'connected' | 'expired' | 'revoked' | 'error';
  last_status: string | null;
  last_synced_at: string | null;
  primary_calendar_id: string | null;
  auto_create_deadlines: boolean;
};

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google Calendar',
  outlook: 'Outlook Calendar (Microsoft 365)',
};

export function CalendarIntegrationsManager() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/calendar/integrations', { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function onSyncNow(id: string) {
    try {
      const r = await fetch(`/api/calendar/integrations/${id}/sync-now`, { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`Sync: ${d.inserted ?? 0} eventos`);
      void refresh();
    } catch {
      toast.error('No pude sincronizar');
    }
  }

  async function onDelete(id: string) {
    if (!confirm('¿Desconectar este calendario?')) return;
    const r = await fetch(`/api/calendar/integrations/${id}`, { method: 'DELETE' });
    if (r.ok) {
      toast.success('Calendario desconectado');
      void refresh();
    } else {
      toast.error('No pude desconectar');
    }
  }

  async function onAuthorize(integration: Integration) {
    const r = await fetch(`/api/calendar/oauth/${integration.provider}/start?integration_id=${integration.id}`);
    const d = await r.json();
    if (!d.configured) {
      toast.message('OAuth no configurado', { description: d.instructions });
      return;
    }
    window.location.href = d.auth_url;
  }

  return (
    <div className="grid gap-3">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="serif text-[15px] font-semibold">Calendarios</h3>
          <p className="text-[12px] muted">
            Conecta Google Calendar / Outlook · eventos con <code>#lexai</code> se convierten en plazos del caso.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={14} aria-hidden="true" /> Conectar calendario
        </button>
      </header>

      <div className="surface p-[var(--pad-card)]">
        {loading ? (
          <div className="flex items-center gap-2 text-[12px] muted">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="text-[12.5px] muted">
            Sin calendarios conectados. Conecta uno para auto-crear plazos cuando registres audiencias.
          </div>
        ) : (
          <ul className="grid gap-3">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between rounded-md border border-line bg-bg-elev p-3">
                <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-accent" aria-hidden="true" />
                  <div>
                    <div className="text-[13px] font-semibold">{it.email_address}</div>
                    <div className="text-[11.5px] muted">
                      {PROVIDER_LABEL[it.provider]}
                      {it.last_synced_at ? ` · sync ${formatRelative(it.last_synced_at)}` : ''}
                      {it.auto_create_deadlines && ' · auto-deadlines'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Status status={it.status} />
                  {it.status !== 'connected' && (
                    <button className="btn" onClick={() => onAuthorize(it)}>Autorizar</button>
                  )}
                  <button className="btn" onClick={() => onSyncNow(it.id)} title="Sincronizar ahora">
                    <RefreshCcw size={12} aria-hidden="true" />
                  </button>
                  <button className="btn" onClick={() => onDelete(it.id)} title="Desconectar">
                    <Trash2 size={12} className="text-red-500" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refresh} />
    </div>
  );
}

function Status({ status }: { status: Integration['status'] }) {
  const m: Record<Integration['status'], { label: string; cls: string; icon: JSX.Element }> = {
    connected: { label: 'Conectado', cls: 'border-emerald-500/40 text-emerald-500', icon: <CheckCircle2 size={11} aria-hidden="true" /> },
    pending: { label: 'Pendiente', cls: 'border-amber-500/40 text-amber-500', icon: <Loader2 size={11} className="animate-spin" aria-hidden="true" /> },
    expired: { label: 'Expirado', cls: 'border-amber-500/40 text-amber-500', icon: <XCircle size={11} aria-hidden="true" /> },
    revoked: { label: 'Revocado', cls: 'border-red-500/40 text-red-500', icon: <XCircle size={11} aria-hidden="true" /> },
    error: { label: 'Error', cls: 'border-red-500/40 text-red-500', icon: <XCircle size={11} aria-hidden="true" /> },
  };
  const v = m[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${v.cls}`}>
      {v.icon}
      {v.label}
    </span>
  );
}

function CreateDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [provider, setProvider] = useState<'google' | 'outlook'>('google');
  const [email, setEmail] = useState('');
  const [autoCreate, setAutoCreate] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/calendar/integrations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider, email_address: email.trim(), auto_create_deadlines: autoCreate }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success('Calendario creado · ahora autoriza el acceso');
      onCreated();
      onOpenChange(false);
      setEmail('');
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 surface p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Conectar calendario</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider muted">Proveedor</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'google' | 'outlook')}
                className="w-full rounded-md border border-line bg-bg-elev p-[10px] text-[13px] outline-none"
              >
                <option value="google">Google Calendar</option>
                <option value="outlook">Outlook Calendar</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider muted">Correo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abogado@miestudio.co"
                className="w-full rounded-md border border-line bg-bg-elev p-[10px] text-[13px] outline-none"
              />
            </div>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" checked={autoCreate} onChange={(e) => setAutoCreate(e.target.checked)} />
              Auto-crear plazos cuando el evento tenga <code>#lexai</code>
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
                Crear
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
