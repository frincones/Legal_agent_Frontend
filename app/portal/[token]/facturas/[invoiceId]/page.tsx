import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatCOP } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

async function fetchInvoice(token: string, invoiceId: string) {
  try {
    const r = await fetch(
      `${API_BASE}/v1/portal/${encodeURIComponent(token)}/invoices/${invoiceId}`,
      { cache: 'no-store' },
    );
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export default async function PortalFacturaDetalle({ params }: { params: { token: string; invoiceId: string } }) {
  const data = await fetchInvoice(params.token, params.invoiceId);
  if (!data) notFound();
  const inv = data.invoice;
  return (
    <div className="grid gap-4">
      <Link href={`/portal/${params.token}/facturas`} className="text-[12.5px] muted hover:underline">← Volver a facturas</Link>

      <section className="surface p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider muted">Factura</div>
            <div className="serif text-[24px] font-semibold mono">{inv.number}</div>
            <div className="mt-1 text-[12.5px] muted">
              Periodo: {inv.period_start} → {inv.period_end}
              {inv.due_date && ` · Vence ${new Date(inv.due_date).toLocaleDateString('es-CO')}`}
            </div>
          </div>
          <div className="text-right">
            <div className="serif text-[26px] font-semibold">{formatCOP(inv.total_cop)}</div>
            <div className="text-[12px] muted">{inv.status}</div>
          </div>
        </div>
      </section>

      <section className="surface p-4">
        <h2 className="serif mb-2 text-[15px] font-semibold">Detalle</h2>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
              <th className="py-1">Concepto</th>
              <th className="py-1 text-right">Cant.</th>
              <th className="py-1 text-right">Unit.</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(data.lines || []).map((l: any, i: number) => (
              <tr key={i} className="border-t border-line/40">
                <td className="py-1">{l.description}</td>
                <td className="py-1 text-right mono">{l.qty}</td>
                <td className="py-1 text-right mono">{formatCOP(l.unit_price_cop)}</td>
                <td className="py-1 text-right mono font-semibold">{formatCOP(l.total_cop)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[12.5px]">
          <div>Subtotal</div><div className="text-right mono">{formatCOP(inv.subtotal_cop)}</div>
          <div>IVA ({inv.tax_pct}%)</div><div className="text-right mono">{formatCOP(inv.tax_cop)}</div>
          {inv.retencion_cop > 0 && (
            <>
              <div>Retención</div><div className="text-right mono">-{formatCOP(inv.retencion_cop)}</div>
            </>
          )}
          <div className="text-[14px] font-semibold">Total</div>
          <div className="text-right mono text-[14px] font-semibold">{formatCOP(inv.total_cop)}</div>
        </div>
        {inv.notes && <div className="mt-3 rounded-md border border-line bg-bg-elev p-3 text-[12px]">{inv.notes}</div>}
      </section>
    </div>
  );
}
