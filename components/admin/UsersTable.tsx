'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

type User = {
  id: string; email: string; full_name: string | null; role: string;
  firm_id: string; firm_name: string | null; mfa_enrolled: boolean;
  last_login_at: string | null; created_at: string;
};

export function UsersTable() {
  const [items, setItems] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('limit', '50');
    fetch(`/api/admin/users?${params}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
      .then((d) => { setItems(d.items || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function resetPwd(user: User) {
    if (!confirm(`¿Enviar email de reset a ${user.email}?`)) return;
    const r = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: 'POST' });
    if (r.ok) {
      const d = await r.json();
      if (d.ok) toast.success(`Email enviado a ${user.email}`);
      else toast.warning(d.message || 'Solo se registró auditoría');
    } else toast.error('No se pudo enviar el email');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="surface flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            className="input pl-8" placeholder="Buscar por email o nombre…"
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
          />
        </div>
        <button className="btn btn-primary btn-sm" onClick={load}>Buscar</button>
      </div>
      <div className="surface overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-[13px] muted">
            <Loader2 size={14} className="animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-[13px] muted">Sin resultados</div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Firm</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Creado</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t border-line/40">
                  <td className="px-3 py-2 font-mono text-[11px]">{u.email}</td>
                  <td className="px-3 py-2">{u.full_name || '—'}</td>
                  <td className="px-3 py-2 text-[11.5px] muted">{u.firm_name || '—'}</td>
                  <td className="px-3 py-2"><span className="chip chip-neutral text-[10px]">{u.role}</span></td>
                  <td className="px-3 py-2 text-[11px] muted">
                    {new Date(u.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button className="btn btn-ghost btn-sm" onClick={() => resetPwd(u)} title="Reset password">
                      <KeyRound size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="text-[11px] muted">{items.length} de {total} usuarios</div>
    </div>
  );
}
