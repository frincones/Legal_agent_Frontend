import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';
import { StatusBoard } from '@/components/public/StatusBoard';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export const metadata = {
  title: 'Estado del sistema · LexAI',
  description: 'Uptime en tiempo real · API, base de datos, IA, voz, email · incidentes recientes.',
};

async function fetchStatus(origin: string) {
  try {
    const [summary, incidents] = await Promise.all([
      fetch(`${origin}/api/public/status`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
      fetch(`${origin}/api/public/status/incidents?limit=10`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : { items: [] }),
    ]);
    return { summary, incidents: incidents?.items || [] };
  } catch {
    return { summary: null, incidents: [] };
  }
}

export default async function StatusPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const data = await fetchStatus(base);

  return (
    <main className="min-h-screen bg-bg">
      <PublicNav />
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-12">
        <header className="text-center mb-8">
          <h1 className="serif text-4xl font-semibold tracking-tight md:text-5xl">
            Estado del sistema
          </h1>
          <p className="mt-3 text-[13px] muted">
            Uptime en vivo de todos los componentes · refrescado cada 30s
          </p>
        </header>
        <StatusBoard initialData={data} />
      </section>
      <PublicFooter />
    </main>
  );
}
