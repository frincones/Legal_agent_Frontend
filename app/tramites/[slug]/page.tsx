import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Logo } from '@/components/atoms/Logo';
import { WizardRunner } from '@/components/wizards/WizardRunner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchTemplate(slug: string, origin: string) {
  try {
    const r = await fetch(`${origin}/api/public/wizards/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export default async function WizardPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { token?: string };
}) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const tpl = await fetchTemplate(params.slug, base);
  if (!tpl) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 border-b border-line">
        <Link href="/tramites" className="flex items-center gap-2 text-ink-3 hover:text-ink">
          <Logo size={18} />
          <span className="text-[12.5px]">Volver</span>
        </Link>
        <div className="text-[11.5px] muted">{tpl.firm_name || 'LexAI'}</div>
      </header>
      <WizardRunner slug={params.slug} initialToken={searchParams.token || undefined} />
    </main>
  );
}
