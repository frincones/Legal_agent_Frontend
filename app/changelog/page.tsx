import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'Changelog · LexAI',
  description: 'Todas las novedades de LexAI · nuevos features, mejoras y correcciones.',
};

async function fetchChangelog(origin: string) {
  try {
    const res = await fetch(`${origin}/api/public/changelog?limit=50`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

const CATEGORY_CLS: Record<string, string> = {
  feature: 'chip-accent', improvement: 'chip-purple',
  fix: 'chip-neutral', breaking: 'chip-bad', announcement: 'chip-warn',
};

const CATEGORY_LABEL: Record<string, string> = {
  feature: 'Nuevo', improvement: 'Mejora',
  fix: 'Fix', breaking: 'Breaking', announcement: 'Anuncio',
};

export default async function ChangelogPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const entries = await fetchChangelog(base);

  return (
    <main className="min-h-screen bg-bg">
      <PublicNav />

      <section className="mx-auto max-w-3xl px-6 pt-12 pb-12 text-center">
        <span className="chip chip-purple">Última actualización · {new Date().toLocaleDateString('es-CO')}</span>
        <h1 className="serif mt-6 text-4xl font-semibold tracking-tight md:text-5xl leading-tight">
          Cambios y novedades
        </h1>
        <p className="mt-4 text-[14px] text-ink-2 leading-relaxed">
          Todo lo nuevo de LexAI · cada feature, cada mejora, cada cambio rastreable.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        {entries.length === 0 ? (
          <div className="surface p-8 text-center text-[13px] muted">
            Aún no hay entradas. Vuelve pronto.
          </div>
        ) : (
          <ol className="grid gap-6">
            {entries.map((c: any) => (
              <li key={c.slug} className="surface p-5">
                <header className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={cn('chip text-[10px]', CATEGORY_CLS[c.category] || 'chip-neutral')}>
                    {CATEGORY_LABEL[c.category] || c.category}
                  </span>
                  {c.version && (
                    <span className="mono text-[11px] muted">{c.version}</span>
                  )}
                  {c.highlighted && (
                    <span className="chip chip-warn text-[10px]">Destacado</span>
                  )}
                  <span className="ml-auto text-[11px] muted">
                    {new Date(c.released_at).toLocaleDateString('es-CO', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </header>
                <h2 className="serif text-[18px] font-semibold leading-tight">{c.title}</h2>
                {c.summary && (
                  <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">{c.summary}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <PublicFooter />
    </main>
  );
}
