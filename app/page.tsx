import Link from 'next/link';
import { Check, Sparkles, Scale, Zap, ShieldCheck, Bell, Quote } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';
import { LandingHero } from '@/components/landing/LandingHero';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'LexAI · Plataforma legal con IA verificada para abogados de habla hispana',
  description: 'Asistente IA voice-first · investigación jurisprudencial con cero hallucination · Court Watcher · multi-país.',
};

async function fetchLandingData(origin: string) {
  try {
    const [stats, testimonials, changelog] = await Promise.all([
      fetch(`${origin}/api/public/landing-stats`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
      fetch(`${origin}/api/public/testimonials?featured_only=true&limit=3`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : { items: [] }),
      fetch(`${origin}/api/public/changelog?highlighted_only=true&limit=3`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : { items: [] }),
    ]);
    return { stats, testimonials: testimonials?.items || [], changelog: changelog?.items || [] };
  } catch {
    return { stats: null, testimonials: [], changelog: [] };
  }
}

export default async function LandingPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const data = await fetchLandingData(base);

  return (
    <main className="min-h-screen bg-bg">
      <PublicNav />

      <LandingHero stats={data.stats} />

      {/* Killer features section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="serif mb-3 text-center text-[28px] font-semibold md:text-[36px]">
          Lo que hace diferente a LexAI
        </h2>
        <p className="mb-12 text-center text-[14px] text-ink-2 max-w-2xl mx-auto leading-relaxed">
          Si has usado ChatGPT para redactar un escrito legal y has tenido que reescribirlo desde cero
          para validar cada cita, vamos a hablar el mismo idioma.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Bell size={20} />}
            title="Court Watcher · cero visitas al juzgado"
            body="Monitoreo automático de tus expedientes en los portales judiciales. Audiencias, cambios de juez y notificaciones llegan antes que a la contraparte."
            tone="accent"
          />
          <FeatureCard
            icon={<Scale size={20} />}
            title="Fundamentación con IA verificada"
            body='Cero "jurisprudencia inventada". Cada cita viene con URL directa a Corte Constitucional, Corte Suprema y Consejo de Estado. Validación de derogaciones en vivo.'
            tone="purple"
          />
          <FeatureCard
            icon={<Sparkles size={20} />}
            title="Simulador de jueces"
            body="Antes de presentar tu escrito, simula cómo lo recibirá el juez asignado. 15 magistrados modelados · alignment score + fortalezas + riesgos."
            tone="accent"
          />
          <FeatureCard
            icon={<Zap size={20} />}
            title="Voice-first · habla con tus casos"
            body='"Abre el caso de María", "redacta una contestación" — el asistente IA ejecuta. Liquidaciones laborales en 30 segundos.'
            tone="purple"
          />
          <FeatureCard
            icon={<ShieldCheck size={20} />}
            title="Validador de evidencia"
            body="Análisis forense de documentos · detección de inconsistencias · scoring probativo. Identifica si la contraparte cita mal un artículo."
            tone="accent"
          />
          <FeatureCard
            icon={<Check size={20} />}
            title="Multi-país desde el diseño"
            body="Colombia · México · Honduras · Guatemala. Glosario procesal local + cuerpos normativos internos sectoriales soportados."
            tone="purple"
          />
        </div>
      </section>

      {/* Social proof · testimonials */}
      {data.testimonials.length > 0 && (
        <section className="border-t border-line bg-bg-elev/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="serif mb-12 text-center text-[24px] font-semibold md:text-[30px]">
              Lo que dicen nuestros clientes
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {data.testimonials.map((t: any) => (
                <div key={t.slug} className="surface flex flex-col gap-3 p-5">
                  <Quote size={18} className="text-accent opacity-40" />
                  <p className="flex-1 text-[13px] text-ink-2 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                  <footer className="border-t border-line/40 pt-3">
                    <div className="font-medium text-[12.5px]">{t.author_name}</div>
                    <div className="text-[11px] muted">
                      {t.author_role}{t.firm_name && ` · ${t.firm_name}`}
                    </div>
                  </footer>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing teaser */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="serif mb-3 text-[28px] font-semibold md:text-[34px]">
          Empieza gratis. Sin tarjeta.
        </h2>
        <p className="mb-8 text-[14px] text-ink-2 max-w-xl mx-auto leading-relaxed">
          14 días con acceso a Pro. Después tu cuenta pasa automáticamente al plan
          Free (gratis, con límites). Nunca te cobramos sin tu autorización.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/signup" className="btn btn-primary btn-lg">
            Crear cuenta gratis
          </Link>
          <Link href="/pricing" className="btn btn-lg">
            Ver todos los planes
          </Link>
        </div>
      </section>

      {/* What's new · changelog teaser */}
      {data.changelog.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <header className="mb-8 flex items-center justify-between">
              <h2 className="serif text-[22px] font-semibold">Últimas novedades</h2>
              <Link href="/changelog" className="text-[12.5px] text-accent hover:underline">
                Ver todas →
              </Link>
            </header>
            <ul className="grid gap-3">
              {data.changelog.map((c: any) => (
                <li key={c.slug} className="surface p-4 hover:border-accent transition-colors">
                  <Link href={`/changelog/${c.slug}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="chip chip-accent text-[10px]">{c.category}</span>
                          {c.version && <span className="mono text-[10.5px] muted">{c.version}</span>}
                        </div>
                        <h3 className="serif mt-1 text-[15px] font-semibold">{c.title}</h3>
                        {c.summary && <p className="mt-1 text-[12.5px] muted">{c.summary}</p>}
                      </div>
                      <span className="text-[10.5px] muted whitespace-nowrap">
                        {new Date(c.released_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <PublicFooter />
    </main>
  );
}

function FeatureCard({
  icon, title, body, tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: 'accent' | 'purple';
}) {
  return (
    <div className="surface p-5">
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${tone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-purple-soft text-purple'}`}>
        {icon}
      </span>
      <h3 className="serif mt-3 text-[16px] font-semibold leading-tight">{title}</h3>
      <p className="mt-2 text-[12.5px] text-ink-2 leading-relaxed">{body}</p>
    </div>
  );
}
