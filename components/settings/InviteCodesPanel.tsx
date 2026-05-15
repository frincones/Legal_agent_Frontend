'use client';

import { useEffect, useState } from 'react';
import { Copy, Loader2, Plus, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Invite = {
  id: string; code: string; role_to_assign: string;
  max_uses: number; used_count: number;
  expires_at: string | null; created_at: string;
};

const ROLE_LABEL: Record<string, string> = {
  lawyer: 'Abogado', paralegal: 'Paralegal',
  secretary: 'Secretaria', socio_junior: 'Socio junior', admin: 'Admin',
};

const CAN_INVITE_ROLES = ['admin', 'socio_senior', 'socio_junior', 'in_house', 'independiente'];

export function InviteCodesPanel({ currentRole }: { currentRole: string }) {
  const canInvite = CAN_INVITE_ROLES.includes(currentRole);
  const [items, setItems] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ role_to_assign: 'lawyer', max_uses: 10, expires_in_days: 30 });

  function load() {
    setLoading(true);
    fetch('/api/me/firm-invites', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { if (canInvite) load(); else setLoading(false); }, [canInvite]);

  async function generate() {
    const r = await fetch('/api/me/firm-invites', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      toast.success('Código generado');
      setShowForm(false);
      load();
    } else {
      const d = await r.json().catch(() => ({}));
      toast.error(d.detail || 'No se pudo generar');
    }
  }

  async function revoke(id: string) {
    if (!confirm('¿Revocar este código? Los usuarios que ya se unieron seguirán activos, solo no se podrá usar de nuevo.')) return;
    const r = await fetch(`/api/me/firm-invites/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Código revocado'); load(); }
  }

  function copyCode(code: string) {
    const inviteLink = `${window.location.origin}/signup?invite=${code}`;
    navigator.clipboard.writeText(inviteLink).then(() => toast.success('Link de invitación copiado'));
  }

  if (!canInvite) {
    return (
      <div className="surface p-4 text-[12.5px] muted">
        <strong>Códigos de invitación:</strong> solo admin / socios pueden generarlos.
      </div>
    );
  }

  return (
    <section className="surface p-5">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="serif text-[16px] font-semibold">Códigos de invitación</h3>
          <p className="text-[11.5px] muted">
            Genera códigos para que nuevos miembros se unan a tu despacho con Google SSO o signup.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={13} /> Generar código
        </button>
      </header>

      {showForm && (
        <div className="grid gap-2 mb-4 rounded-md border border-line bg-bg-elev p-3 md:grid-cols-3">
          <label className="text-[11px]">
            <div className="mb-1 muted">Rol a asignar</div>
            <select className="input w-full" value={form.role_to_assign}
              onChange={(e) => setForm({ ...form, role_to_assign: e.target.value })}>
              <option value="lawyer">Abogado</option>
              <option value="paralegal">Paralegal</option>
              <option value="secretary">Secretaria</option>
              <option value="socio_junior">Socio junior</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="text-[11px]">
            <div className="mb-1 muted">Máx. usos</div>
            <input type="number" min={1} max={1000} className="input w-full"
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} />
          </label>
          <label className="text-[11px]">
            <div className="mb-1 muted">Expira en (días)</div>
            <input type="number" min={1} max={365} className="input w-full"
              value={form.expires_in_days}
              onChange={(e) => setForm({ ...form, expires_in_days: Number(e.target.value) })} />
          </label>
          <button className="btn btn-primary md:col-span-3" onClick={generate}>Generar</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[12px] muted py-3">
          <Loader2 size={12} className="animate-spin" /> Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="text-[12px] muted py-3 text-center">Sin códigos activos.</div>
      ) : (
        <ul className="grid gap-2">
          {items.map((i) => {
            const expired = i.expires_at && new Date(i.expires_at) < new Date();
            const exhausted = i.used_count >= i.max_uses;
            const active = !expired && !exhausted;
            return (
              <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-bg p-3">
                <code className={cn('mono text-[14px] font-bold tracking-wider px-2 py-1 rounded',
                  active ? 'bg-accent-soft text-accent' : 'bg-bg-sunken muted line-through')}>
                  {i.code}
                </code>
                <div className="flex-1 text-[11.5px]">
                  <span className="font-medium">{ROLE_LABEL[i.role_to_assign] || i.role_to_assign}</span>
                  <span className="muted"> · usado {i.used_count}/{i.max_uses}</span>
                  {i.expires_at && (
                    <span className="muted"> · expira {new Date(i.expires_at).toLocaleDateString('es-CO')}</span>
                  )}
                  {expired && <span className="chip chip-bad text-[9px] ml-2">expirado</span>}
                  {exhausted && <span className="chip chip-warn text-[9px] ml-2">agotado</span>}
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-sm" title="Copiar link de invitación"
                    onClick={() => copyCode(i.code)}>
                    <Share2 size={12} />
                  </button>
                  <button className="btn btn-ghost btn-sm text-bad" onClick={() => revoke(i.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
