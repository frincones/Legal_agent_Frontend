import Link from 'next/link';
import { Logo } from '@/components/atoms/Logo';
import { PricingGrid } from '@/components/billing/PricingGrid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Plan = {
  code: string;
  name: string;
  monthly_cop: number;
  annual_cop: number;
  q_users: number | null;
  q_matters: number | null;
  q_documents_mo: number | null;
  q_llm_calls_mo: number | null;
  q_voice_min_mo: number | null;
  q_email_accounts: number | null;
  q_judicial_subs: number | null;
  f_court_watcher: boolean;
  f_email_ingest: boolean;
  f_voice: boolean;
  f_canvas: boolean;
  f_calc: boolean;
  f_briefing: boolean;
  f_priority_support: boolean;
};

async function fetchPlans(origin: string): Promise<Plan[]> {
  try {
    const res = await fetch(`${origin}/api/public/billing/plans`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).filter((p: Plan) => p.code !== 'enterprise' || p.monthly_cop > 0);
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const plans = await fetchPlans(base);

  return (
    <main className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} />
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/tramites" className="text-[12.5px] text-ink-3 hover:text-ink">
            Tramites ciudadanos
          </Link>
          <Link href="/login" className="text-[12.5px] text-ink-3 hover:text-ink">
            Iniciar sesión
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Empezar gratis
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-12 pb-8 text-center">
        <span className="chip chip-purple">14 días gratis · sin tarjeta de crédito</span>
        <h1 className="serif mt-6 text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
          Planes que escalan con tu despacho
        </h1>
        <p className="mt-4 text-[14px] text-ink-2 leading-relaxed">
          Empieza gratis con el plan Free. Sin compromisos, sin tarjeta. Cuando tu
          equipo crezca, escala a Pro o Firma. Cancelable en cualquier momento.
        </p>
      </section>

      <PricingGrid plans={plans} />

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="surface p-6">
          <h2 className="serif mb-3 text-[20px] font-semibold">Preguntas frecuentes</h2>
          <div className="grid gap-4 text-[13px]">
            <details className="group">
              <summary className="cursor-pointer font-medium">¿Qué pasa al final del trial?</summary>
              <p className="mt-2 muted">
                Tu cuenta pasa automáticamente al plan Free (gratuito, con límites).
                Nunca te cobramos sin que actives un plan pago manualmente.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer font-medium">¿Puedo cancelar cuando quiera?</summary>
              <p className="mt-2 muted">
                Sí. Cancelas con un click desde /settings/billing. Conservas el plan
                hasta el final del periodo facturado, sin renovación automática.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer font-medium">¿Aceptan facturación electrónica DIAN?</summary>
              <p className="mt-2 muted">
                Sí. Emitimos factura electrónica con NIT, retenciones y resolución
                DIAN vigente, vía nuestro partner de facturación.
              </p>
            </details>
            <details className="group">
              <summary className="cursor-pointer font-medium">¿Mis datos están seguros?</summary>
              <p className="mt-2 muted">
                Cumplimos Habeas Data (Ley 1581/2012 CO). Datos cifrados en reposo y
                tránsito. No usamos tus datos para entrenar modelos de IA.
              </p>
            </details>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-6 text-center text-[11px] muted">
        © 2026 LexAI · Plataforma legal con IA · Colombia
      </footer>
    </main>
  );
}
