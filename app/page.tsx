import Link from 'next/link';
import { Logo } from '@/components/atoms/Logo';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo size={20} />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn btn-sm btn-ghost">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="btn btn-sm btn-primary">
            Empezar prueba 14 días
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <span className="chip chip-purple">Beta privada · Bogotá D.C.</span>
        <h1 className="font-serif text-5xl font-semibold tracking-tight md:text-6xl mt-6 leading-tight">
          El primer asistente legal <span className="text-accent">voice-first</span> para abogados colombianos.
        </h1>
        <p className="mt-6 text-lg text-ink-2 leading-relaxed">
          Dicta lo que necesitas y LexAI ejecuta investigación jurisprudencial, redacta la promoción
          en tiempo real y verifica cada cita contra Corte Constitucional, Corte Suprema y Consejo
          de Estado. Reemplaza el 60% del trabajo repetitivo de un paralegal junior.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/signup" className="btn btn-lg btn-primary">
            Reservar demo · COP 950.000 reembolsable
          </Link>
          <Link href="/login" className="btn btn-lg">
            Ya tengo cuenta
          </Link>
        </div>
        <p className="mt-6 text-sm text-ink-3">
          Verificación de tarjeta profesional · MFA obligatorio · Habeas Data Ley 1581/2012
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-3">
        {[
          { k: '0%', l: 'jurisprudencia inventada · contra Corte Const., Suprema, CE' },
          { k: '<840ms', l: 'latencia voz E2E p50 · OpenAI Realtime cascada híbrida' },
          { k: '14 días', l: 'prueba gratuita · sin compromiso, cancela con un click' },
        ].map((s) => (
          <div key={s.k} className="surface p-6 text-center">
            <div className="font-serif text-4xl font-semibold tabular text-ink">{s.k}</div>
            <div className="mt-2 text-sm muted">{s.l}</div>
          </div>
        ))}
      </section>

      <footer className="border-t border-line py-6 text-center text-xs muted">
        © 2026 LexAI · Asistencia documental con IA · No constituye representación legal.
      </footer>
    </main>
  );
}
