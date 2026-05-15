'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/atoms/Logo';
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
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Modo de ejercicio', subtitle: '¿Cómo ejerces tu profesión?' },
  { id: 2, title: 'Áreas de práctica', subtitle: '¿En qué te especializas?' },
  { id: 3, title: 'Datos profesionales', subtitle: 'Identificación y rol' },
  { id: 4, title: 'Listo', subtitle: 'Tour rápido del workspace' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  // Wizard state
  const [mode, setMode] = useState<ModoEjercicio | null>(null);
  const [areas, setAreas] = useState<PracticeArea[]>([]);
  const [primary, setPrimary] = useState<PracticeArea | null>(null);
  const [role, setRole] = useState<UserRole>('lawyer');
  const [fullName, setFullName] = useState('');
  const [cedula, setCedula] = useState('');

  const canAdvance = useMemo(() => {
    switch (step) {
      case 1:
        return mode !== null;
      case 2:
        return areas.length >= 1;
      case 3:
        return role && fullName.trim().length >= 2;
      default:
        return true;
    }
  }, [step, mode, areas, role, fullName]);

  // When mode changes, suggest a default role
  const handleModeChange = useCallback((next: ModoEjercicio) => {
    setMode(next);
    const suggested = SUGGESTED_ROLES_BY_MODE[next];
    if (suggested.length > 0 && (!role || !suggested.includes(role))) {
      setRole(suggested[0]!);
    }
  }, [role]);

  const handleSubmit = useCallback(async () => {
    if (!mode) return;
    setBusy(true);
    try {
      const res = await fetch('/api/profile/me/onboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          modo_ejercicio: mode,
          role,
          practice_areas: areas,
          primary_area: primary,
          full_name: fullName.trim() || undefined,
          cedula_profesional: cedula.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `Error ${res.status}`);
      }
      toast.success('¡Bienvenido! Tu workspace está listo.');
      router.replace('/inicio?welcome=1');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error completando onboarding');
    } finally {
      setBusy(false);
    }
  }, [mode, role, areas, primary, fullName, cedula, router]);

  return (
    <div className="min-h-screen bg-bg p-6">
      <header className="mx-auto flex max-w-3xl items-center gap-3">
        <Logo size={18} />
        <span className="serif text-[14px] font-semibold">LexAI · Onboarding</span>
        <span className="ml-auto text-[11.5px] muted">
          Paso {step} de {STEPS.length}
        </span>
      </header>

      <ProgressBar step={step} total={STEPS.length} />

      <main className="surface mx-auto mt-6 max-w-3xl p-6">
        <div className="mb-4">
          <h1 className="serif text-[22px] font-semibold -tracking-[0.01em]">
            {STEPS[step - 1]?.title}
          </h1>
          <p className="mt-1 text-[13px] muted">{STEPS[step - 1]?.subtitle}</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <ModeSelector selected={mode} onChange={handleModeChange} />
            {mode && (
              <p className="text-[12px] muted">
                Tu workspace se adaptará al perfil <strong>{modeLabel(mode)}</strong>: sidebar,
                atajos y prompts del asistente.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <PracticeAreasSelector
              selected={areas}
              primary={primary}
              onChange={({ areas: a, primary: p }) => {
                setAreas(a);
                setPrimary(p);
              }}
            />
            <p className="text-[12px] muted">
              Selecciona al menos una. La estrella marca tu <strong>área principal</strong>, que
              prioriza tus atajos.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-[11.5px] font-medium muted">Nombre completo</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
                placeholder="Ej: María Rodríguez Velázquez"
                autoFocus
                required
                minLength={2}
              />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-medium muted">Cédula profesional / T.P.</span>
              <input
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
                placeholder="Opcional · Ej: 123.456 del C.S. de la J."
              />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-medium muted">Rol funcional</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              >
                {(mode ? SUGGESTED_ROLES_BY_MODE[mode] : []).length > 0 && (
                  <optgroup label={`Sugeridos para ${modeLabel(mode)}`}>
                    {(mode ? SUGGESTED_ROLES_BY_MODE[mode] : []).map((r) => (
                      <option key={r} value={r}>{ROLES[r].label}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Otros roles">
                  {Object.entries(ROLES)
                    .filter(([k]) => !((mode ? SUGGESTED_ROLES_BY_MODE[mode] : []) as string[]).includes(k))
                    .map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                </optgroup>
              </select>
            </label>
          </div>
        )}

        {step === 4 && (
          <Step4Done mode={mode} areas={areas} role={role} fullName={fullName} />
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
          <button
            type="button"
            className="btn"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || busy}
          >
            <ArrowLeft size={12} aria-hidden="true" />
            Atrás
          </button>
          <span className="ml-auto" />
          {step < STEPS.length ? (
            <button
              type="button"
              className={cn('btn btn-primary', !canAdvance && 'opacity-60')}
              onClick={() => canAdvance && setStep((s) => s + 1)}
              disabled={!canAdvance || busy}
            >
              Continuar
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleSubmit()}
              disabled={busy}
            >
              {busy ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={14} aria-hidden="true" />
              )}
              {busy ? 'Guardando…' : 'Entrar al workspace'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((step - 1) / (total - 1)) * 100;
  return (
    <div className="mx-auto mt-4 max-w-3xl">
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function Step4Done({
  mode,
  areas,
  role,
  fullName,
}: {
  mode: ModoEjercicio | null;
  areas: PracticeArea[];
  role: UserRole;
  fullName: string;
}) {
  return (
    <div className="space-y-4 text-[13px]">
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="font-semibold text-emerald-700 dark:text-emerald-300">
          {fullName ? `Listo, ${fullName.split(' ')[0]}.` : '¡Listo!'}
        </div>
        <p className="mt-1 muted">
          Tu workspace se configurará con:
        </p>
        <ul className="mt-2 space-y-1 muted">
          <li>· Modo: <strong>{modeLabel(mode)}</strong></li>
          <li>· Rol: <strong>{ROLES[role]?.label ?? role}</strong></li>
          <li>· Áreas: <strong>{areas.length > 0 ? areas.length : 'sin definir'}</strong></li>
        </ul>
      </div>
      <p className="muted">
        Cuando entres al workspace verás:
      </p>
      <ul className="ml-5 list-disc space-y-1 muted">
        <li>Tus casos categorizados por materia.</li>
        <li>Atajos al frente para tus áreas principales.</li>
        <li>Live Canvas con voz, citas verificadas y export Word.</li>
        <li>Notificaciones del juzgado y deadlines próximos.</li>
      </ul>
    </div>
  );
}
