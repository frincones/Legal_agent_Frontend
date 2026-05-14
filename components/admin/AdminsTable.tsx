'use client';

import { useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Admin = {
  id: string; auth_user_id: string; email: string; full_name: string | null;
  role: string; active: boolean; last_login_at: string | null; created_at: string;
};

const ROLE_CLS: Record<string, string> = {
  owner: 'chip-purple', admin: 'chip-accent',
  support: 'chip-warn', readonly: 'chip-neutral',
};

export function AdminsTable() {
  const [items, setItems] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('admin');

  function load() {
    setLoading(true);
    fetch('/api/admin/admin-users', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function createAdmin() {
    if (!email) return;
    const r = await fetch('/api/admin/admin-users', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, full_name: name || null, role }),
    });
    if (r.ok) {
      toast.success('Admin creado · pídele que haga login con su email');
      setShowForm(false); setEmail(''); setName('');
      load();
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(data.detail || 'No se pudo crear');
    }
  }

  async function toggleActive(admin: Admin) {
    const r = await fetch(`/api/admin/admin-users/${admin.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active: !admin.active }),
    });
    if (r.ok) { toast.success(`${admin.email} ${!admin.active ? 'activado' : 'desactivado'}`); load(); }
    else toast.error('No se pudo actualizar');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <UserPlus size={13} /> Invitar admin
        </button>
      </div>

      {showForm && (
        <div className="surface grid gap-2 p-4 md:grid-cols-4">
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
            <option value="readonly">Read-only</option>
            <option value="owner">Owner</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={createAdmin}>Crear</button>
        </div>
      )}

      {loading ? (
        <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Último login</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-line/40">
                  <td className="px-3 py-2 font-mono text-[11px]">{a.email}</td>
                  <td className="px-3 py-2">{a.full_name || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={cn('chip text-[10px]', ROLE_CLS[a.role] || 'chip-neutral')}>{a.role}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn('chip text-[10px]', a.active ? 'chip-ok' : 'chip-bad')}>
                      {a.active ? 'activo' : 'inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] muted">
                    {a.last_login_at ? new Date(a.last_login_at).toLocaleDateString('es-CO') : 'Nunca'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(a)}>
                      {a.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
