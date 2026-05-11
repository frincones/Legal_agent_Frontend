'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { canManageFirm, PRACTICE_AREAS, type PracticeArea } from '@/lib/auth/roles';

type Team = {
  id: string;
  socio_id: string;
  socio_name: string | null;
  name: string;
  area_practica: PracticeArea | null;
  description: string | null;
  member_count: number;
  created_at: string;
};

export function TeamsManager({ userRole }: { userRole: string }) {
  const canManage = canManageFirm(userRole);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [area, setArea] = useState<PracticeArea | ''>('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/firm-teams', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as Team[];
      setTeams(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron cargar los equipos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      setCreating(true);
      try {
        const res = await fetch('/api/firm-teams', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            area_practica: area || null,
            description: description.trim() || null,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text.slice(0, 200) || `Error ${res.status}`);
        }
        toast.success('Equipo creado');
        setName('');
        setArea('');
        setDescription('');
        void load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error creando equipo');
      } finally {
        setCreating(false);
      }
    },
    [name, area, description, load],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('¿Eliminar este equipo? Esta acción es irreversible.')) return;
      try {
        const res = await fetch(`/api/firm-teams/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (!res.ok && res.status !== 204) throw new Error(`Error ${res.status}`);
        toast.success('Equipo eliminado');
        void load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error eliminando equipo');
      }
    },
    [load],
  );

  if (!canManage) {
    return (
      <div className="surface p-6 text-center muted">
        Solo los socios y admins de la firma pueden gestionar sub-equipos. Tu rol actual es{' '}
        <strong>{userRole}</strong>.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface p-[var(--pad-card)]">
        <h3 className="serif text-[15px] font-semibold">Crear nuevo equipo</h3>
        <p className="mt-1 text-[12.5px] muted">
          Tú serás el socio líder. Después podrás agregar miembros desde la lista.
        </p>
        <form onSubmit={handleCreate} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11.5px] font-medium muted">Nombre del equipo</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              placeholder="Ej: Equipo laboral senior"
              minLength={2}
              maxLength={120}
            />
          </label>
          <label className="block">
            <span className="text-[11.5px] font-medium muted">Área de práctica (opcional)</span>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value as PracticeArea | '')}
              className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
            >
              <option value="">— Sin especificar —</option>
              {Object.entries(PRACTICE_AREAS).map(([key, m]) => (
                <option key={key} value={key}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[11.5px] font-medium muted">Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="mt-1 w-full resize-y rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              placeholder="Ej: Atendemos casos contenciosos del sector financiero."
            />
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className={cn('btn btn-primary', creating && 'opacity-60')}
              disabled={creating}
            >
              <Plus size={14} aria-hidden="true" />
              {creating ? 'Creando…' : 'Crear equipo'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="serif mb-2 text-[15px] font-semibold">
          Equipos del despacho ({teams?.length ?? 0})
        </h3>
        {loading ? (
          <div className="surface p-6 text-center muted">Cargando…</div>
        ) : !teams || teams.length === 0 ? (
          <div className="surface p-6 text-center muted">
            Aún no hay equipos. Crea el primero arriba.
          </div>
        ) : (
          <ul className="space-y-2">
            {teams.map((t) => (
              <li
                key={t.id}
                className="surface flex items-start gap-4 p-[var(--pad-card)]"
              >
                <span className="grid h-9 w-9 flex-none place-items-center rounded-md bg-accent-soft text-accent">
                  <Users size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold">{t.name}</span>
                    {t.area_practica && (
                      <span className="chip chip-blue">
                        {PRACTICE_AREAS[t.area_practica]?.label ?? t.area_practica}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11.5px] muted">
                    Socio líder: {t.socio_name ?? '—'} · {t.member_count} miembro
                    {t.member_count === 1 ? '' : 's'}
                  </div>
                  {t.description && (
                    <p className="mt-2 text-[12.5px] text-ink-2">{t.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="btn btn-sm"
                  aria-label="Eliminar equipo"
                  title="Eliminar equipo"
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
