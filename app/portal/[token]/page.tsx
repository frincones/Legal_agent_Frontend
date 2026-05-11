import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, FileText, ShieldCheck } from 'lucide-react';
import { formatCOP } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

type Home = {
  scope: string[];
  client: { nombre: string | null; tax_id: string | null; personal_id: string | null; email: string | null };
  firm: { razon_social: string | null; nit: string | null };
  summary: { matters_count: number; invoices_open: number; invoices_total_due_cop: number };
};

async function fetchHome(token: string): Promise<Home | null> {
  try {
    const r = await fetch(`${API_BASE}/v1/portal/${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export default async function PortalHome({ params }: { params: { token: string } }) {
  const home = await fetchHome(params.token);
  if (!home) {
    notFound();
  }
  return (
    <div className="grid gap-5">
      <section className="surface p-5">
        <div className="text-[12px] uppercase tracking-wider muted">Bienvenido(a)</div>
        <h1 className="serif mt-1 text-[24px] font-semibold">{home.client.nombre || 'Cliente'}</h1>
        <div className="text-[12.5px] muted">
          {home.firm.razon_social} {home.firm.nit ? `· NIT ${home.firm.nit}` : ''}
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <Card href={`/portal/${params.token}/casos`} icon={<Briefcase size={18} aria-hidden="true" />}
          title="Tus casos" subtitle={`${home.summary.matters_count} caso${home.summary.matters_count !== 1 ? 's' : ''}`} />
        <Card href={`/portal/${params.token}/facturas`} icon={<FileText size={18} aria-hidden="true" />}
          title="Facturas" subtitle={`${home.summary.invoices_open} pendiente${home.summary.invoices_open !== 1 ? 's' : ''} · ${formatCOP(home.summary.invoices_total_due_cop)} por cobrar`} />
        <Card icon={<ShieldCheck size={18} aria-hidden="true" />}
          title="Seguridad" subtitle="Solo lectura. Tu acceso es temporal y revocable." />
      </div>
    </div>
  );
}

function Card({ href, icon, title, subtitle }: { href?: string; icon: JSX.Element; title: string; subtitle: string }) {
  const inner = (
    <div className="surface p-4 transition-colors hover:border-accent">
      <div className="flex items-center gap-2 text-accent">{icon}</div>
      <div className="mt-2 serif text-[16px] font-semibold">{title}</div>
      <div className="text-[12.5px] muted">{subtitle}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
