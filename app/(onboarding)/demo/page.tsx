'use client';

import Link from 'next/link';
import { Ic } from '@/components/atoms/icons';
import { VoiceHUD } from '@/components/voice/VoiceHUD';
import { Logo } from '@/components/atoms/Logo';

const STEPS = [
  { n: 1, t: 'Activa LexAI con tu voz', s: 'Di "Hola LexAI"', state: 'done' as const },
  { n: 2, t: 'Dicta lo que necesitas', s: '"Redáctame demanda Pérez vs. Acme"', state: 'current' as const },
  { n: 3, t: 'Verifica las citas', s: 'Click en cualquier cita azul', state: 'todo' as const },
  { n: 4, t: 'Exporta a Word', s: '⌘E', state: 'todo' as const },
];

export default function OnboardingDemoPage() {
  return (
    <div className="min-h-screen bg-bg p-6">
      <header className="mx-auto flex max-w-5xl items-center gap-4">
        <Logo size={18} />
        <span className="chip chip-purple">Demo · caso ficticio Pérez vs. Acme</span>
        <Link href="/inicio" className="ml-auto btn btn-sm">
          Saltar onboarding
        </Link>
      </header>

      <section className="mx-auto mt-8 max-w-3xl text-center">
        <div className="text-[11.5px] font-semibold uppercase tracking-wider muted">
          Demo mode · 5 minutos
        </div>
        <h1 className="serif m-[6px_0_0] text-[28px] -tracking-[0.02em]">
          Veamos LexAI con un caso de mentira (sin riesgo)
        </h1>
        <p className="m-[6px_0_0] max-w-[680px] text-[13.5px] leading-relaxed muted mx-auto">
          Te llevamos por los 4 momentos clave en menos de 5 minutos. Todo está simulado: no hay
          datos reales de clientes ni se enviará nada al exterior.
        </p>
      </section>

      <section className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-3 md:grid-cols-4">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className={`flex items-center gap-3 rounded-md border bg-bg-elev p-[14px] ${
              s.state === 'done'
                ? 'border-ok/40 bg-ok-soft'
                : s.state === 'current'
                  ? 'border-accent shadow-[0_0_0_3px_rgb(var(--accent-soft-rgb))]'
                  : 'border-line'
            }`}
          >
            <div
              className={`grid h-[28px] w-[28px] flex-none place-items-center rounded-full text-[13px] font-semibold ${
                s.state === 'done'
                  ? 'bg-ok text-white'
                  : s.state === 'current'
                    ? 'bg-accent text-white'
                    : 'bg-bg-sunken text-ink-3'
              }`}
            >
              {s.state === 'done' ? Ic.check : s.n}
            </div>
            <div>
              <div className="text-[14px] font-semibold">{s.t}</div>
              <div className="text-[12px] muted">{s.s}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="surface mx-auto mt-8 max-w-3xl p-8 text-center">
        <div className="mx-auto flex max-w-[520px] flex-col items-center gap-6">
          <VoiceHUD />
          <div>
            <h2 className="serif m-0 text-[22px] -tracking-[0.01em]">Ahora, tú.</h2>
            <p className="mt-2 text-[13.5px] muted">
              Mantén presionado <span className="kbd">␣</span> y di:{' '}
              <i>&ldquo;Redáctame una demanda ordinaria laboral por despido sin justa causa&rdquo;</i>.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm">Saltar onboarding</button>
            <Link href="/inicio" className="btn btn-sm btn-primary">
              Ya terminé, continúa
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
