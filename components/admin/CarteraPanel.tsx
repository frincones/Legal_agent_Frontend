'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Invoice = {
  id: string; number: string; firm_id: string; firm_name: string | null;
  client_name: string | null; total_cop: number; paid_amount_cop: number;
  saldo_cop: number; status: string; due_date: string | null;
  sent_at: string | null; paid_at: string | null; days_overdue: number;
};

const STATUS_CLS: Record<string, string> = {
  draft: 'chip-neutral', sent: 'chip-accent', paid: 'chip-ok',
  partially_paid: 'chip-warn', void: 'chip-bad', overdue: 'chip-bad',
};

function formatCOP(v: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);
}

export function CarteraPanel() {
  const [overview, setOverview] = useState<any>(null);
  const [aging, setAging] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueOnly, setOverdueOnly] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (overdueOnly) params.set('overdue_only', 'true');
    params.set('limit', '50');
    Promise.all([
      fetch('/api/admin/cartera/overview', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
      fetch('/api/admin/cartera/aging', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null),
      fetch(`/api/admin/cartera/invoices?${params}`, { cache: 'no-store' }).then((r) => r.ok ? r.json() : { items: [] }),
    ]).then(([ov, ag, inv]) => {
      setOverview(ov); setAging(ag); setInvoices(inv?.items || []);
    }).finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [overdueOnly]);

  async function markPaid(inv: Invoice) {
    if (!confirm(`¿Marcar factura ${inv.number} como pagada (${formatCOP(inv.total_cop)})?`)) return;
    const r = await fetch(`/api/admin/cartera/invoices/${inv.id}/mark-paid`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (r.ok) { toast.success('Factura marcada como pagada'); load(); }
    else toast.error('No se pudo marcar');
  }

  if (loading) {
    return <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Cartera total" value={formatCOP(overview?.cartera_total || 0)} tone="warn" />
        <Kpi label="Vencido" value={formatCOP(overview?.cartera_vencida || 0)} tone="bad" />
        <Kpi label="Recaudado MTD" value={formatCOP(overview?.recaudado_mtd || 0)} tone="ok" />
        <Kpi label="Facturas abiertas" value={String(overview?.facturas_abiertas || 0)} />
      </div>

      {aging && (
        <section className="surface p-4">
          <h3 className="serif mb-3 text-[15px] font-semibold">Aging</h3>
          <div className="grid grid-cols-5 gap-2 text-center text-[11.5px]">
            <Bucket label="Al día" value={aging.current} />
            <Bucket label="1-30 días" value={aging.d_0_30} tone="warn" />
            <Bucket label="31-60" value={aging.d_31_60} tone="warn" />
            <Bucket label="61-90" value={aging.d_61_90} tone="bad" />
            <Bucket label=">90 días" value={aging.d_over_90} tone="bad" />
          </div>
        </section>
      )}

      <div className="surface flex items-center gap-2 p-3">
        <label className="flex items-center gap-2 text-[12.5px]">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
          Solo facturas vencidas
        </label>
      </div>

      <div className="surface overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-6 text-center text-[13px] muted">Sin facturas</div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Firm</th>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Saldo</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Vencim.</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id} className="border-t border-line/40">
                  <td className="px-3 py-2 font-mono text-[11px]">{i.number}</td>
                  <td className="px-3 py-2 text-[11.5px]">{i.firm_name || '—'}</td>
                  <td className="px-3 py-2 text-[11.5px]">{i.client_name || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCOP(i.total_cop)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatCOP(i.saldo_cop)}</td>
                  <td className="px-3 py-2">
                    <span className={cn('chip text-[10px]', STATUS_CLS[i.status] || 'chip-neutral')}>
                      {i.status}{i.days_overdue ? ` (${i.days_overdue}d)` : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] muted">
                    {i.due_date ? new Date(i.due_date).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {i.status !== 'paid' && i.status !== 'void' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => markPaid(i)} title="Marcar pagada">
                        <CheckCircle size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' | 'bad' }) {
  return (
    <div className="surface p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className={cn('serif mt-1 text-[20px] font-semibold',
        tone === 'ok' && 'text-ok',
        tone === 'warn' && 'text-warn',
        tone === 'bad' && 'text-bad',
      )}>{value}</div>
    </div>
  );
}

function Bucket({ label, value, tone }: { label: string; value: number; tone?: 'warn' | 'bad' }) {
  return (
    <div className="rounded-md border border-line p-2">
      <div className="muted">{label}</div>
      <div className={cn('font-mono text-[14px]', tone === 'warn' && 'text-warn', tone === 'bad' && 'text-bad')}>
        {formatCOP(value || 0)}
      </div>
    </div>
  );
}
