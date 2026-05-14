import Link from 'next/link';
import { Logo } from '@/components/atoms/Logo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type WizardLite = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  brand_color: string;
};

async function fetchWizards(origin: string): Promise<WizardLite[]> {
  try {
    const res = await fetch(`${origin}/api/public/wizards`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  pension: 'Pensión',
  derecho_peticion: 'Derecho de petición',
  tutela: 'Tutela',
  contrato: 'Contratos',
  denuncia: 'Denuncia',
  otro: 'Otro',
};

export default async function WizardLanding() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const wizards = await fetchWizards(base);

  return (
    <main className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Logo size={20} />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-[12.5px] text-ink-3 hover:text-ink">
            ¿Eres abogado? Inicia sesión
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-12 pb-8 text-center">
        <span className="chip chip-purple">Sin registro · sin tarjeta de crédito</span>
        <h1 className="serif mt-6 text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
          Genera tu trámite legal en 5 minutos
        </h1>
        <p className="mt-4 text-[14px] text-ink-2 leading-relaxed">
          Elige el tipo de trámite, responde unas preguntas guiadas y descarga tu
          documento listo para firmar y presentar. Asistencia IA · sin necesidad
          de abogado.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-12 md:grid-cols-3">
        {wizards.length === 0 ? (
          <div className="col-span-full p-10 text-center text-[13px] muted">
            Cargando wizards…
          </div>
        ) : (
          wizards.map((w) => (
            <Link
              key={w.slug}
              href={`/tramites/${w.slug}`}
              className="surface flex flex-col items-start gap-3 p-6 transition hover:border-accent hover:shadow-1"
            >
              <span className="text-[40px]">{w.icon || '📄'}</span>
              <div>
                <span className="chip chip-neutral text-[10px]">
                  {CATEGORY_LABEL[w.category] || w.category}
                </span>
                <h3 className="serif mt-2 text-[18px] font-semibold leading-tight">
                  {w.name}
                </h3>
                <p className="mt-1 text-[12.5px] muted leading-relaxed">
                  {w.description}
                </p>
              </div>
              <span className="mt-auto text-[12px] font-medium text-accent">
                Empezar →
              </span>
            </Link>
          ))
        )}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-md border border-line bg-bg-elev p-4 text-[11.5px] text-ink-3">
          <strong>Importante:</strong> los documentos generados son asistencia IA y NO
          constituyen representación legal. Para casos complejos, busca asesoría de un
          abogado titulado. La información que ingresas no se comparte con terceros sin
          tu autorización · Habeas Data Ley 1581/2012.
        </div>
      </section>

      <footer className="border-t border-line py-6 text-center text-[11px] muted">
        © 2026 LexAI · Asistencia documental con IA · No constituye representación legal.
      </footer>
    </main>
  );
}
