'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  AlertTriangle, Check, Copy, Eye, Key, Loader2, Plus, Power, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  rate_limit_per_min: number;
  active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  last_used_ip: string | null;
  use_count: number;
  revoked_at: string | null;
  created_at: string;
};

type CreatedKey = ApiKey & { plain_key: string };

const COMMON_SCOPES = [
  'read', 'write',
  'matters.read', 'matters.write',
  'clients.read', 'clients.write',
  'leads.read', 'leads.write',
  'insights.read',
];

export function ApiKeysManager() {
  const [items, setItems] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/api-keys', { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function toggleActive(k: ApiKey) {
    const r = await fetch(`/api/api-keys/${k.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active: !k.active }),
    });
    if (r.ok) { toast.success(k.active ? 'Pausada' : 'Activada'); void refresh(); }
  }

  async function revoke(k: ApiKey) {
    if (!confirm(`¿Revocar la API key "${k.name}"? No se puede deshacer.`)) return;
    const r = await fetch(`/api/api-keys/${k.id}/revoke`, { method: 'POST' });
    if (r.ok) { toast.success('Key revocada'); void refresh(); }
  }

  async function del(k: ApiKey) {
    if (!confirm(`¿Eliminar permanentemente "${k.name}"?`)) return;
    const r = await fetch(`/api/api-keys/${k.id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Eliminada'); void refresh(); }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado'));
  }

  return (
    <div className="grid gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="serif text-[16px] font-semibold">API keys</h2>
          <p className="text-[12px] muted">
            Acceso programático a LexAI desde ERPs, CRMs, scripts. Bearer/X-API-Key con scopes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpenCreate(true)}>
          <Plus size={14} aria-hidden="true" /> Nueva key
        </button>
      </header>

      {loading ? (
        <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="surface p-6 text-center text-[12.5px] muted">
          Sin API keys. Crea una para integrar LexAI con tu software.
        </div>
      ) : (
        <div className="surface overflow-x-auto p-2">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                <th className="py-2">Nombre</th>
                <th className="py-2">Prefix</th>
                <th className="py-2">Scopes</th>
                <th className="py-2 text-right">Usos</th>
                <th className="py-2">Último uso</th>
                <th className="py-2">Estado</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((k) => (
                <tr key={k.id} className={cn('border-t border-line text-[12.5px]', k.revoked_at && 'opacity-50')}>
                  <td className="py-2.5 font-semibold">
                    <Key size={12} className="mr-1 inline text-accent" aria-hidden="true" /> {k.name}
                  </td>
                  <td className="py-2.5 mono text-[11px]">{k.prefix}…</td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.slice(0, 3).map((s) => (
                        <span key={s} className="rounded border border-line bg-bg-elev px-1.5 py-0.5 text-[10px] mono">
                          {s}
                        </span>
                      ))}
                      {k.scopes.length > 3 && (
                        <span className="text-[10.5px] muted">+{k.scopes.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 text-right mono">{k.use_count}</td>
                  <td className="py-2.5 muted">{k.last_used_at ? formatRelative(k.last_used_at) : 'nunca'}</td>
                  <td className="py-2.5">
                    {k.revoked_at ? (
                      <span className="text-[10.5px] text-red-500">revocada</span>
                    ) : (
                      <button onClick={() => toggleActive(k)} title={k.active ? 'Pausar' : 'Activar'}>
                        <Power size={14} className={k.active ? 'text-emerald-500' : 'text-ink-3'} aria-hidden="true" />
                      </button>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      {!k.revoked_at && (
                        <button className="btn" onClick={() => revoke(k)} title="Revocar (no se puede deshacer)">
                          Revocar
                        </button>
                      )}
                      <button className="btn" onClick={() => del(k)} title="Eliminar">
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
        onCreated={(k) => { setCreatedKey(k); refresh(); }}
      />
      {createdKey && (
        <ShowKeyDialog created={createdKey} onClose={() => setCreatedKey(null)} />
      )}

      <section className="surface p-4 text-[12px]">
        <h3 className="serif mb-2 text-[14px] font-semibold">Ejemplo de uso</h3>
        <pre className="rounded bg-bg-elev p-3 text-[11px] mono whitespace-pre-wrap break-all">
{`# Listar matters
curl https://legal-agent-backend-production-fcfa.up.railway.app/v1/public/matters \\
  -H "X-API-Key: lex_live_..."

# Crear lead
curl -X POST .../v1/public/leads \\
  -H "X-API-Key: lex_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"nombre":"Juan Pérez","email":"juan@x.com","source":"api"}'

# Whoami
curl .../v1/public/me -H "X-API-Key: lex_live_..."`}
        </pre>
      </section>
    </div>
  );
}

function CreateDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (k: CreatedKey) => void;
}) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<string[]>(['read']);
  const [rate, setRate] = useState(60);
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);

  function toggleScope(s: string) {
    setScopes((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name, scopes,
          rate_limit_per_min: rate,
          expires_in_days: expiresInDays || null,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      onCreated(d);
      onOpenChange(false);
      setName(''); setScopes(['read']); setRate(60); setExpiresInDays('');
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[520px] max-w-[94vw] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Crear API key</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Nombre interno">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Integración ERP corporativo" className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Scopes (permisos)">
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SCOPES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleScope(s)}
                    className={cn(
                      'rounded border px-2 py-0.5 text-[11px] mono',
                      scopes.includes(s) ? 'border-accent text-accent bg-accent/10' : 'border-line text-ink-2',
                    )}
                  >
                    {scopes.includes(s) && <Check size={9} className="mr-0.5 inline" aria-hidden="true" />}
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Rate limit / min">
                <input type="number" min={1} max={10000} value={rate} onChange={(e) => setRate(parseInt(e.target.value) || 60)} className="w-full bg-transparent outline-none" />
              </Field>
              <Field label="Expira en N días (opcional)">
                <input type="number" min={1} value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full bg-transparent outline-none" placeholder="nunca" />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy || !name.trim() || scopes.length === 0}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Key size={12} aria-hidden="true" />}
                Generar key
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ShowKeyDialog({ created, onClose }: { created: CreatedKey; onClose: () => void }) {
  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado'));
  }
  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[520px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 surface border-amber-500/40 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" aria-hidden="true" />
            <Dialog.Title className="serif text-[16px] font-semibold">Copia tu API key ahora</Dialog.Title>
          </div>
          <p className="mt-2 text-[12.5px] muted">
            Esta es la única vez que verás la key completa. Si la pierdes, tendrás que generar una nueva.
          </p>
          <div className="mt-3 rounded border border-line bg-bg-elev p-3">
            <code className="text-[11px] mono break-all">{created.plain_key}</code>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button className="btn" onClick={() => copy(created.plain_key)}>
              <Copy size={12} aria-hidden="true" /> Copiar
            </button>
            <button className="btn btn-primary" onClick={onClose}>Ya la copié</button>
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
      <div className="rounded-md border border-line bg-bg-elev p-[10px] text-[13px] focus-within:border-accent">{children}</div>
    </div>
  );
}
