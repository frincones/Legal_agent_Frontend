import Link from 'next/link';
import { Logo } from '@/components/atoms/Logo';
import { PricingMatrix } from '@/components/pricing/PricingMatrix';
import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Planes y precios · LexAI',
  description: 'Plataforma legal con IA · 5 planes desde gratis a enterprise. Trial 14 días sin tarjeta.',
};

async function fetchPlansBundle(origin: string) {
  try {
    const res = await fetch(`${origin}/api/public/plans-bundle`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PricingPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const bundle = await fetchPlansBundle(base);

  return (
    <main className="min-h-screen bg-bg">
      <PublicNav />

      <section className="mx-auto max-w-4xl px-6 pt-12 pb-8 text-center">
        <span className="chip chip-purple">14 días gratis · sin tarjeta de crédito</span>
        <h1 className="serif mt-6 text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
          Planes que escalan con tu despacho
        </h1>
        <p className="mt-4 text-[14px] text-ink-2 leading-relaxed max-w-2xl mx-auto">
          Desde abogado independiente hasta firma con socios y enterprise.
          Empieza gratis hoy y mejora cuando estés listo. Cancelable en cualquier momento.
        </p>
      </section>

      {bundle ? (
        <PricingMatrix plans={bundle.plans} modules={bundle.modules} quotas={bundle.quotas} />
      ) : (
        <div className="mx-auto max-w-5xl px-6 pb-12 text-center text-[13px] muted">
          Cargando planes…
        </div>
      )}

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="serif mb-4 text-center text-[24px] font-semibold">Preguntas frecuentes</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <details className="surface p-4 group cursor-pointer">
            <summary className="font-medium text-[13px]">¿Qué pasa al final del trial?</summary>
            <p className="mt-2 text-[12.5px] muted">
              Tu cuenta pasa automáticamente al plan Free (gratuito, con límites).
              Nunca te cobramos sin que actives un plan pago manualmente.
            </p>
          </details>
          <details className="surface p-4 group cursor-pointer">
            <summary className="font-medium text-[13px]">¿Puedo cancelar cuando quiera?</summary>
            <p className="mt-2 text-[12.5px] muted">
              Sí. Cancelas con un click desde /settings/billing. Conservas el plan
              hasta el final del periodo facturado, sin renovación automática.
            </p>
          </details>
          <details className="surface p-4 group cursor-pointer">
            <summary className="font-medium text-[13px]">¿Aceptan facturación electrónica DIAN?</summary>
            <p className="mt-2 text-[12.5px] muted">
              Sí. Emitimos factura electrónica con NIT, retenciones y resolución
              DIAN vigente, vía nuestro partner de facturación.
            </p>
          </details>
          <details className="surface p-4 group cursor-pointer">
            <summary className="font-medium text-[13px]">¿Mis datos están seguros?</summary>
            <p className="mt-2 text-[12.5px] muted">
              Cumplimos Habeas Data (Ley 1581/2012 CO). Datos cifrados en reposo y
              tránsito. No usamos tus datos para entrenar modelos de IA.{' '}
              <Link href="/seguridad" className="text-accent hover:underline">Ver detalles</Link>
            </p>
          </details>
          <details className="surface p-4 group cursor-pointer">
            <summary className="font-medium text-[13px]">¿Cuál es la diferencia entre Pro y Firm?</summary>
            <p className="mt-2 text-[12.5px] muted">
              Pro es para abogados independientes (1 usuario · 30 casos · Court Watcher · jueces IA).
              Firm añade colaboración multi-usuario, knowledge base, analytics ejecutivo
              y soporte para 5 abogados.
            </p>
          </details>
          <details className="surface p-4 group cursor-pointer">
            <summary className="font-medium text-[13px]">¿Pueden ajustar un plan a mis necesidades?</summary>
            <p className="mt-2 text-[12.5px] muted">
              Sí. En Enterprise definimos cuotas y módulos a la medida. Cuerpos
              normativos internos sectoriales también soportados.
            </p>
          </details>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
