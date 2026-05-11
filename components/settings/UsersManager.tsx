'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Mail, MoreHorizontal, ShieldCheck, ShieldOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';
import {
  isPartnerRole,
  modeLabel,
  ROLES,
  type UserRole,
} from '@/lib/auth/roles';

type FirmUser = {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole | string;
  modo_ejercicio: string | null;
  cedula_profesional: string | null;
  onboarded_at: string | null;
  mfa_enrolled: boolean;
  last_login_at: string | null;
  practice_areas: string[];
  is_self: boolean;
};

const ASSIGNABLE_ROLES: UserRole[] = [
  'admin',
  'socio_senior', 'socio_junior',
  'lawyer', 'paralegal',
  'in_house', 'funcionario_publico', 'consultor', 'independiente',
  'readonly',
];

export function UsersManager({
  currentUserId,
  currentUserRole,
}: {
  currentUserId: string;
  currentUserRole: string;
}) {
  const canManage = isPartnerRole(currentUserRole) || currentUserRole === 'admin';
  const [users, setUsers] = useState<FirmUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<FirmUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/firm-users', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setUsers((await res.json()) as FirmUser[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleDeactivate = useCallback(
    async (u: FirmUser) => {
      if (!window.confirm(`¿Desactivar el acceso de ${u.full_name} (${u.email})?`)) return;
      try {
        const res = await fetch(`/api/firm-users/${encodeURIComponent(u.user_id)}/deactivate`, {
          method: 'POST',
        });
        if (!res.ok && res.status !== 204) throw new Error(`Error ${res.status}`);
        toast.success(`${u.full_name} desactivado`);
        void load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error desactivando');
      }
    },
    [load],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h3 className="serif text-[15px] font-semibold">
          {users?.length ?? 0} usuarios en el despacho
        </h3>
        {canManage && (
          <button
            type="button"
            className="btn btn-primary ml-auto"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus size={14} aria-hidden="true" />
            Invitar usuario
          </button>
        )}
      </div>

      {loading ? (
        <div className="surface flex items-center gap-2 p-6 muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Cargando…
        </div>
      ) : !users || users.length === 0 ? (
        <div className="surface p-6 text-center muted">No hay usuarios.</div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Usuario</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-left">Modo</th>
                <th className="px-3 py-2 text-left">Áreas</th>
                <th className="px-3 py-2 text-left">Último acceso</th>
                <th className="px-3 py-2 text-right">MFA</th>
                {canManage && <th className="px-3 py-2 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} className="border-t border-line align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium text-ink">
                      {u.full_name}
                      {u.is_self && (
                        <span className="chip chip-blue ml-2 align-middle">Tú</span>
                      )}
                    </div>
                    <div className="mono text-[11.5px] muted">{u.email}</div>
                    {u.cedula_profesional && (
                      <div className="text-[11px] muted">T.P. {u.cedula_profesional}</div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="chip">{ROLES[u.role as UserRole]?.label ?? u.role}</span>
                  </td>
                  <td className="px-3 py-3 muted">{modeLabel(u.modo_ejercicio)}</td>
                  <td className="px-3 py-3 muted">
                    {u.practice_areas.length === 0 ? '—' : u.practice_areas.slice(0, 3).join(', ')}
                    {u.practice_areas.length > 3 && (
                      <span className="muted"> +{u.practice_areas.length - 3}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 muted">
                    {u.last_login_at ? formatRelative(u.last_login_at) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {u.mfa_enrolled ? (
                      <ShieldCheck size={14} className="ml-auto text-emerald-500" aria-label="MFA activo" />
                    ) : (
                      <ShieldOff size={14} className="ml-auto text-ink-3" aria-label="MFA desactivado" />
                    )}
                  </td>
                  {canManage && (
                    <td className="px-3 py-3 text-right">
                      <RowActions
                        user={u}
                        currentUserId={currentUserId}
                        onEdit={() => setEditing(u)}
                        onDeactivate={() => handleDeactivate(u)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && (
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvited={() => {
            setInviteOpen(false);
            void load();
          }}
        />
      )}
      {canManage && editing && (
        <EditUserDialog
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function RowActions({
  user,
  currentUserId,
  onEdit,
  onDeactivate,
}: {
  user: FirmUser;
  currentUserId: string;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="btn btn-icon btn-ghost btn-sm"
        onClick={() => setOpen((o) => !o)}
        aria-label="Más acciones"
      >
        <MoreHorizontal size={14} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="surface absolute right-0 top-full z-10 mt-1 w-44 p-1 shadow-2"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            className="block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-bg-sunken"
            onClick={() => { setOpen(false); onEdit(); }}
          >
            Editar usuario
          </button>
          {user.user_id !== currentUserId && (
            <button
              type="button"
              className="block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] text-danger hover:bg-danger-soft"
              onClick={() => { setOpen(false); onDeactivate(); }}
            >
              Desactivar acceso
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('lawyer');
  const [busy, setBusy] = useState(false);

  const reset = useCallback(() => { setEmail(''); setName(''); setRole('lawyer'); }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !name.trim()) return;
      setBusy(true);
      try {
        const res = await fetch('/api/firm-users/invite', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), full_name: name.trim(), role }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text.slice(0, 200) || `Error ${res.status}`);
        }
        toast.success(`Invitación enviada a ${email}`);
        reset();
        onInvited();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error invitando');
      } finally {
        setBusy(false);
      }
    },
    [email, name, role, reset, onInvited],
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(540px,92vw)] -translate-x-1/2 -translate-y-1/2 p-6 shadow-3 outline-none">
          <Dialog.Title className="serif text-[18px] font-semibold">
            Invitar nuevo usuario
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-[12.5px] muted">
            Le enviamos un email con un magic link para que active su cuenta.
          </Dialog.Description>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
            <label className="block">
              <span className="text-[11.5px] font-medium muted">Email</span>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-line bg-bg-elev px-3 py-2 focus-within:border-accent">
                <Mail size={14} className="text-ink-3" aria-hidden="true" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent text-[13px] outline-none"
                  placeholder="abogado@firma.co"
                  autoFocus
                />
              </div>
            </label>
            <label className="block">
              <span className="text-[11.5px] font-medium muted">Nombre completo</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
                placeholder="María Rodríguez"
                minLength={2}
              />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-medium muted">Rol funcional</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLES[r]?.label ?? r}</option>
                ))}
              </select>
            </label>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => { onOpenChange(false); reset(); }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <UserPlus size={14} aria-hidden="true" />
                )}
                {busy ? 'Enviando…' : 'Enviar invitación'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: FirmUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.full_name);
  const [role, setRole] = useState<UserRole>(user.role as UserRole);
  const [busy, setBusy] = useState(false);

  const dirty = useMemo(
    () => name.trim() !== user.full_name || role !== user.role,
    [name, role, user.full_name, user.role],
  );

  const handleSave = useCallback(async () => {
    if (!dirty) { onClose(); return; }
    setBusy(true);
    try {
      const patch: Record<string, string> = {};
      if (name.trim() !== user.full_name) patch.full_name = name.trim();
      if (role !== user.role) patch.role = role;
      const res = await fetch(`/api/firm-users/${encodeURIComponent(user.user_id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `Error ${res.status}`);
      }
      toast.success('Usuario actualizado');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error actualizando');
    } finally {
      setBusy(false);
    }
  }, [dirty, name, role, user, onSaved, onClose]);

  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(480px,92vw)] -translate-x-1/2 -translate-y-1/2 p-6 shadow-3 outline-none">
          <Dialog.Title className="serif text-[18px] font-semibold">Editar usuario</Dialog.Title>
          <Dialog.Description className="mt-1 text-[12.5px] muted">
            {user.email}
          </Dialog.Description>
          <div className="mt-4 grid gap-3">
            <label className="block">
              <span className="text-[11.5px] font-medium muted">Nombre completo</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-medium muted">Rol funcional</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLES[r]?.label ?? r}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className={cn('btn btn-primary', !dirty && 'opacity-60')}
              disabled={!dirty || busy}
              onClick={() => void handleSave()}
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : null}
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
