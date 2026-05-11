import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cn, formatCOP } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  sent: { label: 'Pendiente', cls: 'border-blue-500/40 text-blue-500' },
  partially_paid: { label: 'Pago parcial', cls: 'border-amber-500/40 text-amber-500' },
  paid: { label: 'Pagada', cls: 'border-emerald-500/40 text-emerald-500' },
  overdue: { label: 'Vencida', cls: 'border-red-500/40 text-red-500' },
};

async function fetchInvoices(token: string) {
  try {
    const r = await fetch(`${API_BASE}/v1/portal/${encodeURIComponent(token)}/invoices`, { cache: 'no-store' });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export default async function PortalFacturas({ params }: { params: { token: string } }) {
  const data = await fetchInvoices(params.token);
  if (!data) notFound();
  const items = data.items || [];
  return (
    <div className="grid gap-3">
      <header>
        <Link href={`/portal/${params.token}`} className="text-[12.5px] muted hover:underline">← Volver</Link>
        <h1 className="serif mt-1 text-[22px] font-semibold">Tus facturas ({items.length})</h1>
      </header>
      {items.length === 0 ? (
        <div className="surface p-4 text-[12.5px] muted">No tienes facturas emitidas.</div>
      ) : (
        items.map((it: any) => {
          const meta = STATUS_LABEL[it.status] || { label: it.status, cls: 'border-line' };
          return (
            <Link key={it.id} href={`/portal/${params.token}/facturas/${it.id}`} className="surface flex items-center gap-3 p-3 transition-colors hover:border-accent">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="mono text-[13px] font-semibold">{it.number}</span>
                  <span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold', meta.cls)}>{meta.label}</span>
                </div>
                <div className="text-[11.5px] muted">
                  {it.period_start} → {it.period_end}
                  {it.due_date && ` · vence ${new Date(it.due_date).toLocaleDateString('es-CO')}`}
                </div>
              </div>
              <div className="text-right">
                <div className="serif text-[16px] font-semibold">{formatCOP(it.total_cop)}</div>
                {it.paid_amount_cop > 0 && it.paid_amount_cop < it.total_cop && (
                  <div className="text-[11px] muted">Pagado: {formatCOP(it.paid_amount_cop)}</div>
                )}
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
