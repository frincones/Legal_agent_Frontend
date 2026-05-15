import Link from 'next/link';
import { Quote, Star } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'Clientes · LexAI',
  description: 'Casos de uso y testimonios de abogados que ya usan LexAI en Colombia, Honduras, Guatemala y México.',
};

async function fetchTestimonials(origin: string) {
  try {
    const res = await fetch(`${origin}/api/public/testimonials?limit=24`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export default async function CustomersPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const testimonials = await fetchTestimonials(base);

  const grouped = testimonials.reduce((acc: Record<string, any[]>, t: any) => {
    const key = t.area_practica || 'otro';
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  const AREA_LABEL: Record<string, string> = {
    laboral: 'Derecho laboral', civil: 'Derecho civil',
    comercial: 'Derecho comercial', administrativo: 'Contencioso administrativo',
    familia: 'Derecho de familia', tributario: 'Derecho tributario',
    penal: 'Derecho penal', otro: 'Otras áreas',
  };

  return (
    <main className="min-h-screen bg-bg">
      <PublicNav />

      <section className="mx-auto max-w-4xl px-6 pt-12 pb-12 text-center">
        <span className="chip chip-purple">Casos de uso reales</span>
        <h1 className="serif mt-6 text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
          Abogados que ya transformaron su día a día con LexAI
        </h1>
        <p className="mt-4 text-[14px] text-ink-2 leading-relaxed max-w-2xl mx-auto">
          De abogados independientes en Armenia a contencioso administrativo en Honduras,
          la voz del usuario guía nuestra hoja de ruta.
        </p>
      </section>

      {testimonials.length === 0 ? (
        <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
          <p className="text-[13px] muted">Próximamente publicaremos casos de uso de clientes reales.</p>
        </section>
      ) : (
        Object.entries(grouped).map(([area, items]: [string, any]) => (
          <section key={area} className="mx-auto max-w-6xl px-6 pb-12">
            <h2 className="serif mb-4 text-[20px] font-semibold">{AREA_LABEL[area] || area}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((t: any) => (
                <TestimonialCard key={t.slug} t={t} />
              ))}
            </div>
          </section>
        ))
      )}

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="serif mb-3 text-[24px] font-semibold">Únete a ellos</h2>
        <p className="mb-6 text-[13px] muted">
          Trial 14 días sin tarjeta · Configuración guiada · Datos demo incluidos.
        </p>
        <Link href="/signup" className="btn btn-primary btn-lg">
          Empezar gratis
        </Link>
      </section>

      <PublicFooter />
    </main>
  );
}

function TestimonialCard({ t }: { t: any }) {
  return (
    <div className="surface flex flex-col gap-3 p-5">
      <header className="flex items-center justify-between">
        <span className="chip chip-neutral text-[10px]">{t.country}</span>
        {t.rating && (
          <span className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} className={i < t.rating ? 'fill-warn text-warn' : 'text-ink-3'} />
            ))}
          </span>
        )}
      </header>
      <Quote size={18} className="text-accent opacity-40" />
      <p className="flex-1 text-[13px] text-ink-2 leading-relaxed italic">"{t.quote}"</p>
      <footer className="border-t border-line/40 pt-3">
        <div className="font-medium text-[12.5px]">{t.author_name}</div>
        <div className="text-[10.5px] muted">
          {t.author_role}{t.firm_name && ` · ${t.firm_name}`}
        </div>
      </footer>
    </div>
  );
}
