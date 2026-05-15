import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/public/PublicNav';
import { PublicFooter } from '@/components/public/PublicFooter';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const CATEGORY_CLS: Record<string, string> = {
  feature: 'chip-accent', improvement: 'chip-purple',
  fix: 'chip-neutral', breaking: 'chip-bad', announcement: 'chip-warn',
};

async function fetchEntry(slug: string, origin: string) {
  try {
    const res = await fetch(`${origin}/api/public/changelog/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Simple markdown → HTML (sin lib, solo bold/italic/headings/lists/code)
function renderMd(md: string): string {
  let html = md;
  // Code blocks (triple backtick)
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="surface p-3 my-3 overflow-auto text-[11.5px]"><code>${escapeHtml(code.trim())}</code></pre>`);
  // Headings
  html = html.replace(/^### (.*)$/gm, '<h3 class="serif text-[15px] font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2 class="serif text-[18px] font-semibold mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1 class="serif text-[22px] font-semibold mt-6 mb-3">$1</h1>');
  // Bold + italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="mono text-[12px] bg-bg-sunken px-1 rounded">$1</code>');
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul class="ml-4 list-disc grid gap-1 my-2 text-[13px]">${m}</ul>`);
  // Paragraphs (lines that are not lists/headings/code)
  html = html.split(/\n\n+/).map((p) => {
    if (p.startsWith('<')) return p;
    return `<p class="my-2 leading-relaxed text-[13px]">${p}</p>`;
  }).join('\n');
  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function ChangelogEntryPage({ params }: { params: { slug: string } }) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const entry = await fetchEntry(params.slug, base);
  if (!entry) notFound();

  return (
    <main className="min-h-screen bg-bg">
      <PublicNav />

      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/changelog" className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-ink mb-6">
          <ArrowLeft size={12} /> Volver al changelog
        </Link>

        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('chip text-[10px]', CATEGORY_CLS[entry.category] || 'chip-neutral')}>
              {entry.category}
            </span>
            {entry.version && <span className="mono text-[11px] muted">{entry.version}</span>}
            <span className="ml-auto text-[11px] muted">
              {new Date(entry.released_at).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>
          <h1 className="serif mt-3 text-[28px] font-semibold leading-tight">{entry.title}</h1>
          {entry.summary && (
            <p className="mt-3 text-[14px] text-ink-2 leading-relaxed">{entry.summary}</p>
          )}
        </header>

        <div
          className="text-ink-2"
          dangerouslySetInnerHTML={{ __html: renderMd(entry.body_md) }}
        />
      </article>

      <PublicFooter />
    </main>
  );
}
