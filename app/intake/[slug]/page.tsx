import { notFound } from 'next/navigation';
import { PublicIntakeForm } from '@/components/intake/PublicIntakeForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type FormDef = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  fields: Array<{
    id: string;
    label: string;
    kind: string;
    required?: boolean;
    placeholder?: string;
    help?: string;
    options?: string[];
  }>;
  thank_you_message: string | null;
  redirect_url: string | null;
  brand_color: string | null;
  show_firm_logo: boolean;
  firm_name: string | null;
};

async function fetchForm(slug: string, origin: string): Promise<FormDef | null> {
  try {
    const res = await fetch(`${origin}/api/public/intake/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PublicIntakeFormPage({
  params,
}: {
  params: { slug: string };
}) {
  // Use Vercel/site URL to fetch our own /api/public proxy
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  const form = await fetchForm(params.slug, base);
  if (!form) {
    notFound();
  }
  return (
    <main className="min-h-screen bg-bg">
      <PublicIntakeForm form={form} />
    </main>
  );
}
