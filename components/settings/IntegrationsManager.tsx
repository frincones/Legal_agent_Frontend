'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, Loader2, Mail, Plus, RefreshCcw, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatRelative } from '@/lib/utils';

type Integration = {
  id: string;
  user_id: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email_address: string;
  display_name: string | null;
  active: boolean;
  status: 'pending' | 'connected' | 'expired' | 'revoked' | 'error';
  last_status: string | null;
  last_error: string | null;
  last_synced_at: string | null;
  watch_label: string | null;
  filter_query: string | null;
  created_at: string | null;
};

const PROVIDER_LABEL: Record<string, string> = {
  gmail: 'Gmail (Google Workspace)',
  outlook: 'Outlook (Microsoft 365)',
  imap: 'IMAP genérico',
};

export function IntegrationsManager() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email/integrations', { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error cargando integraciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function onTest(id: string) {
    try {
      const res = await fetch(`/api/email/integrations/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) toast.success(`OK · ${data.email_address}`);
      else toast.error(data.message || 'Test falló');
    } catch (e) {
      toast.error('Error en test');
    }
  }

  async function onDelete(id: string) {
    if (!confirm('¿Desconectar esta cuenta?')) return;
    const res = await fetch(`/api/email/integrations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Cuenta desconectada');
      await refresh();
    } else {
      toast.error('No se pudo desconectar');
    }
  }

  async function onAuthorize(integration: Integration) {
    if (integration.provider === 'imap') return;
    const res = await fetch(
      `/api/email/oauth/${integration.provider}/start?integration_id=${integration.id}`,
    );
    const data = await res.json();
    if (!data.configured) {
      toast.message('OAuth no configurado en el servidor', {
        description: data.instructions || 'Pide al admin que configure las credenciales OAuth.',
      });
      return;
    }
    window.location.href = data.auth_url;
  }

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="serif text-[16px] font-semibold">Integraciones de correo</h3>
          <p className="text-[12.5px] muted">
            Conecta Gmail / Outlook para que LexAI lea automáticamente notificaciones legales.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={14} aria-hidden="true" />
          Conectar cuenta
        </button>
      </header>

      <div className="surface p-[var(--pad-card)]">
        {loading ? (
          <div className="flex items-center gap-2 text-[12.5px] muted">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="text-[12.5px] muted">
            No hay cuentas conectadas. Empieza con Gmail u Outlook para que LexAI vigile correos del juzgado.
          </div>
        ) : (
          <ul className="grid gap-3">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between rounded-md border border-line bg-bg-elev p-3"
              >
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-accent" aria-hidden="true" />
                  <div>
                    <div className="text-[13px] font-semibold">{it.email_address}</div>
                    <div className="text-[11.5px] muted">
                      {PROVIDER_LABEL[it.provider] || it.provider}
                      {it.last_synced_at ? ` · sync ${formatRelative(it.last_synced_at)}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={it.status} />
                  {it.provider !== 'imap' && it.status !== 'connected' && (
                    <button className="btn" onClick={() => onAuthorize(it)} title="Autorizar OAuth">
                      Autorizar
                    </button>
                  )}
                  <button className="btn" onClick={() => onTest(it.id)} title="Probar conexión">
                    <RefreshCcw size={12} aria-hidden="true" /> Test
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

function StatusBadge({ status }: { status: Integration['status'] }) {
  const map: Record<Integration['status'], { label: string; className: string; icon: JSX.Element }> = {
    connected: {
      label: 'Conectado',
      className: 'border-emerald-500/40 text-emerald-500',
      icon: <CheckCircle2 size={11} aria-hidden="true" />,
    },
    pending: {
      label: 'Pendiente',
      className: 'border-amber-500/40 text-amber-500',
      icon: <Loader2 size={11} className="animate-spin" aria-hidden="true" />,
    },
    expired: {
      label: 'Expirado',
      className: 'border-amber-500/40 text-amber-500',
      icon: <XCircle size={11} aria-hidden="true" />,
    },
    revoked: {
      label: 'Revocado',
      className: 'border-red-500/40 text-red-500',
      icon: <XCircle size={11} aria-hidden="true" />,
    },
    error: {
      label: 'Error',
      className: 'border-red-500/40 text-red-500',
      icon: <XCircle size={11} aria-hidden="true" />,
    },
  };
  const v = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${v.className}`}
    >
      {v.icon}
      {v.label}
    </span>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [provider, setProvider] = useState<Integration['provider']>('gmail');
  const [email, setEmail] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState<number | ''>(993);
  const [imapUser, setImapUser] = useState('');
  const [imapPass, setImapPass] = useState('');
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        provider,
        email_address: email.trim(),
        watch_label: 'INBOX',
        filter_query: filter || null,
      };
      if (provider === 'imap') {
        body.imap_host = imapHost;
        body.imap_port = imapPort || 993;
        body.imap_username = imapUser || email;
        body.imap_password = imapPass;
      }
      const res = await fetch('/api/email/integrations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Cuenta creada');
      onCreated();
      onOpenChange(false);
      setEmail('');
      setImapHost('');
      setImapUser('');
      setImapPass('');
      setFilter('');
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[480px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 surface p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Conectar cuenta</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Proveedor">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Integration['provider'])}
                className="w-full bg-transparent outline-none"
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="imap">IMAP genérico</option>
              </select>
            </Field>
            <Field label="Correo">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none"
                placeholder="abogado@miestudio.co"
              />
            </Field>
            {provider === 'imap' && (
              <>
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <Field label="IMAP host">
                    <input
                      required
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      placeholder="imap.gmail.com"
                      className="w-full bg-transparent outline-none"
                    />
                  </Field>
                  <Field label="Puerto">
                    <input
                      type="number"
                      value={imapPort}
                      onChange={(e) => setImapPort(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full bg-transparent outline-none"
                    />
                  </Field>
                </div>
                <Field label="Usuario IMAP">
                  <input
                    value={imapUser}
                    onChange={(e) => setImapUser(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="usuario@dominio (usualmente el correo)"
                  />
                </Field>
                <Field label="Contraseña IMAP">
                  <input
                    type="password"
                    required
                    value={imapPass}
                    onChange={(e) => setImapPass(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </Field>
              </>
            )}
            <Field label="Filtro de búsqueda (opcional)">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder='from:@ramajudicial.gov.co OR subject:"notificación"'
                className="w-full bg-transparent outline-none"
              />
            </Field>
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>
                Cancelar
              </button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-wider muted">{label}</label>
      <div className="rounded-md border border-line bg-bg-elev p-[10px_12px] text-[13px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
