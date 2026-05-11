'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ModeSelector } from '@/components/settings/ModeSelector';
import { PracticeAreasSelector } from '@/components/settings/PracticeAreasSelector';
import {
  modeLabel,
  ROLES,
  SUGGESTED_ROLES_BY_MODE,
  type ModoEjercicio,
  type PracticeArea,
  type UserRole,
} from '@/lib/auth/roles';

type Profile = {
  user_id: string;
  firm_id: string;
  email: string;
  full_name: string;
  role: string;
  modo_ejercicio: ModoEjercicio | null;
  onboarded_at: string | null;
  cedula_profesional: string | null;
  practice_areas: PracticeArea[];
  primary_area: PracticeArea | null;
};

export function ProfileEditor() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAreas, setSavingAreas] = useState(false);

  // Local edit state
  const [fullName, setFullName] = useState('');
  const [cedula, setCedula] = useState('');
  const [mode, setMode] = useState<ModoEjercicio | null>(null);
  const [role, setRole] = useState<UserRole>('lawyer');
  const [areas, setAreas] = useState<PracticeArea[]>([]);
  const [primary, setPrimary] = useState<PracticeArea | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/me', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as Profile;
      setProfile(data);
      setFullName(data.full_name ?? '');
      setCedula(data.cedula_profesional ?? '');
      setMode(data.modo_ejercicio ?? null);
      setRole((data.role as UserRole) ?? 'lawyer');
      setAreas(data.practice_areas ?? []);
      setPrimary(data.primary_area ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const suggestedRoles = useMemo(
    () => (mode ? SUGGESTED_ROLES_BY_MODE[mode] : []),
    [mode],
  );

  const handleSaveProfile = useCallback(async () => {
    setSavingProfile(true);
    try {
      // Only send fields that actually changed vs the loaded profile.
      // This avoids hitting backend guards (e.g. role 'admin' is not
      // self-assignable, but if the user was already admin we shouldn't
      // be forwarding it on every save).
      const patch: Record<string, string> = {};
      const trimmedName = fullName.trim();
      if (profile && trimmedName && trimmedName !== profile.full_name) {
        patch.full_name = trimmedName;
      }
      if (profile && mode && mode !== profile.modo_ejercicio) {
        patch.modo_ejercicio = mode;
      }
      if (profile && role && role !== profile.role) {
        patch.role = role;
      }
      const trimmedCedula = cedula.trim();
      if (profile && trimmedCedula !== (profile.cedula_profesional ?? '')) {
        patch.cedula_profesional = trimmedCedula;
      }
      if (Object.keys(patch).length === 0) {
        toast.info('No hay cambios para guardar.');
        setSavingProfile(false);
        return;
      }
      const res = await fetch('/api/profile/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `Error ${res.status}`);
      }
      toast.success('Perfil actualizado');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error guardando perfil');
    } finally {
      setSavingProfile(false);
    }
  }, [profile, fullName, mode, role, cedula, load]);

  const handleSaveAreas = useCallback(async () => {
    setSavingAreas(true);
    try {
      const res = await fetch('/api/profile/me/areas', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ areas, primary_area: primary }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `Error ${res.status}`);
      }
      toast.success('Áreas de práctica actualizadas');
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error guardando áreas');
    } finally {
      setSavingAreas(false);
    }
  }, [areas, primary, load]);

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-6 muted">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        Cargando perfil…
      </div>
    );
  }
  if (!profile) {
    return <div className="surface p-6 text-center muted">No se encontró el perfil.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="surface p-[var(--pad-card)]">
        <h3 className="serif text-[15px] font-semibold">Datos personales</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11.5px] font-medium muted">Nombre completo</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              placeholder="Ej: María Rodríguez"
              maxLength={200}
            />
          </label>
          <label className="block">
            <span className="text-[11.5px] font-medium muted">Cédula profesional / T.P.</span>
            <input
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              placeholder="Ej: 123.456 del C.S. de la J."
            />
          </label>
          <div className="block">
            <span className="text-[11.5px] font-medium muted">Email</span>
            <div className="mt-1 rounded-md border border-line bg-bg-sunken px-3 py-2 text-[13px] muted">
              {profile.email}
            </div>
          </div>
          <div className="block">
            <span className="text-[11.5px] font-medium muted">Modo actual</span>
            <div className="mt-1 rounded-md border border-line bg-bg-sunken px-3 py-2 text-[13px]">
              {modeLabel(profile.modo_ejercicio)}
            </div>
          </div>
        </div>
      </section>

      <section className="surface p-[var(--pad-card)]">
        <h3 className="serif text-[15px] font-semibold">Modo de ejercicio</h3>
        <p className="mt-1 text-[12.5px] muted">
          Define cómo se adapta tu workspace (sidebar, atajos y prompts del asistente).
        </p>
        <div className="mt-3">
          <ModeSelector selected={mode} onChange={setMode} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11.5px] font-medium muted">Rol funcional</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
            >
              {suggestedRoles.length > 0 && (
                <optgroup label={`Sugeridos para ${modeLabel(mode)}`}>
                  {suggestedRoles.map((r) => (
                    <option key={r} value={r}>{ROLES[r].label}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Otros roles">
                {Object.entries(ROLES)
                  .filter(([k]) => !suggestedRoles.includes(k as UserRole))
                  .map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
              </optgroup>
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void handleSaveProfile()}
            disabled={savingProfile}
          >
            <Save size={14} aria-hidden="true" />
            {savingProfile ? 'Guardando…' : 'Guardar perfil'}
          </button>
        </div>
      </section>

      <section className="surface p-[var(--pad-card)]">
        <h3 className="serif text-[15px] font-semibold">Áreas de práctica</h3>
        <p className="mt-1 text-[12.5px] muted">
          Marca las que ejerces. La estrella indica tu <strong>área principal</strong> y prioriza
          tus atajos en el sidebar.
        </p>
        <div className="mt-3">
          <PracticeAreasSelector
            selected={areas}
            primary={primary}
            onChange={({ areas: a, primary: p }) => {
              setAreas(a);
              setPrimary(p);
            }}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void handleSaveAreas()}
            disabled={savingAreas}
          >
            <Save size={14} aria-hidden="true" />
            {savingAreas ? 'Guardando…' : 'Guardar áreas'}
          </button>
        </div>
      </section>
    </div>
  );
}
