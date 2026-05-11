'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, FileText, Loader2, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceWizard } from './InvoiceWizard';
import { cn, formatCOP, formatRelative } from '@/lib/utils';

type Invoice = {
  id: string;
  client_id: string | null;
  matter_id: string | null;
  number: string;
  period_start: string | null;
  period_end: string | null;
  subtotal_cop: number;
  tax_cop: number;
  total_cop: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'void' | 'overdue';
  due_date: string | null;
  sent_at: string | null;
  paid_at: string | null;
  paid_amount_cop: number;
};

type MatterOpt = { id: string; titulo: string; expediente: string | null; client_id: string };

const STATUS_META: Record<Invoice['status'], { label: string; cls: string }> = {
  draft: { label: 'Borrador', cls: 'border-line text-ink-3' },
  sent: { label: 'Enviada', cls: 'border-blue-500/40 text-blue-500' },
  partially_paid: { label: 'Pago parcial', cls: 'border-amber-500/40 text-amber-500' },
  paid: { label: 'Pagada', cls: 'border-emerald-500/40 text-emerald-500' },
  overdue: { label: 'Vencida', cls: 'border-red-500/40 text-red-500' },
  void: { label: 'Anulada', cls: 'border-line text-ink-3 line-through' },
};

export function InvoicesList({ matters }: { matters: MatterOpt[] }) {
  const [items, setItems] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openWizard, setOpenWizard] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: '100' });
      if (statusFilter) q.set('status', statusFilter);
      const r = await fetch(`/api/invoices?${q.toString()}`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function finalize(id: string) {
    if (!confirm('Marcar factura como enviada? (no se puede deshacer fácil)')) return;
    const r = await fetch(`/api/invoices/${id}/finalize`, { method: 'POST' });
    if (r.ok) { toast.success('Factura enviada'); void refresh(); }
    else toast.error('No pude finalizar');
  }

  async function markPaid(id: string) {
    const r = await fetch(`/api/invoices/${id}/mark-paid`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (r.ok) { toast.success('Marcada como pagada'); void refresh(); }
    else toast.error('Error');
  }

  async function voidInv(id: string) {
    if (!confirm('Anular factura? Las horas/gastos vuelven a estar disponibles.')) return;
    const r = await fetch(`/api/invoices/${id}/void`, { method: 'POST' });
    if (r.ok) { toast.success('Anulada'); void refresh(); }
  }

  async function del(id: string) {
    if (!confirm('Eliminar borrador?')) return;
    const r = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Eliminada'); void refresh(); }
  }

  const totals = items.reduce(
    (acc, it) => {
      acc.total += it.total_cop;
      if (it.status === 'paid') acc.paid += it.total_cop;
      if (it.status === 'sent' || it.status === 'partially_paid' || it.status === 'overdue') {
        acc.outstanding += (it.total_cop - it.paid_amount_cop);
      }
      return acc;
    },
    { total: 0, paid: 0, outstanding: 0 },
  );

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="serif text-[16px] font-semibold">Facturas</h3>
          <p className="text-[12px] muted">
            Total {formatCOP(totals.total)} · Por cobrar {formatCOP(totals.outstanding)} · Pagado {formatCOP(totals.paid)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-line bg-bg-elev px-2 py-1 text-[12.5px]">
            <option value="">Todas</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviadas</option>
            <option value="partially_paid">Pago parcial</option>
            <option value="paid">Pagadas</option>
            <option value="overdue">Vencidas</option>
            <option value="void">Anuladas</option>
          </select>
          <button className="btn btn-primary" onClick={() => setOpenWizard(true)}>
            <Plus size={14} aria-hidden="true" /> Nueva factura
          </button>
        </div>
      </header>

      <div className="surface overflow-x-auto p-2">
        {loading ? (
          <div className="flex items-center gap-2 p-3 text-[12.5px] muted">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="p-3 text-[12.5px] muted">Sin facturas. Crea la primera para empezar a cobrar.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider muted">
                <th className="py-2">Número</th>
                <th className="py-2">Periodo</th>
                <th className="py-2 text-right">Subtotal</th>
                <th className="py-2 text-right">Total</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Vence</th>
                <th className="py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-line text-[12.5px]">
                  <td className="py-2 mono font-semibold">{it.number}</td>
                  <td className="py-2 muted">
                    {it.period_start || '—'} · {it.period_end || '—'}
                  </td>
                  <td className="py-2 text-right mono">{formatCOP(it.subtotal_cop)}</td>
                  <td className="py-2 text-right mono font-semibold">{formatCOP(it.total_cop)}</td>
                  <td className="py-2">
                    <span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold', STATUS_META[it.status].cls)}>
                      {STATUS_META[it.status].label}
                    </span>
                  </td>
                  <td className="py-2 muted">
                    {it.due_date ? formatRelative(it.due_date) : '—'}
                  </td>
                  <td className="py-2 text-right">
                    <div className="inline-flex gap-1">
                      {it.status === 'draft' && (
                        <button className="btn" onClick={() => finalize(it.id)} title="Finalizar"><Check size={12} aria-hidden="true" /></button>
                      )}
                      {(it.status === 'sent' || it.status === 'partially_paid' || it.status === 'overdue') && (
                        <button className="btn" onClick={() => markPaid(it.id)} title="Marcar pagada">Pagada</button>
                      )}
                      {it.status === 'draft' && (
                        <button className="btn" onClick={() => del(it.id)} title="Eliminar borrador">×</button>
                      )}
                      {it.status !== 'paid' && it.status !== 'void' && (
                        <button className="btn" onClick={() => voidInv(it.id)} title="Anular">Anular</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <InvoiceWizard open={openWizard} onOpenChange={setOpenWizard} matters={matters} onCreated={refresh} />
    </div>
  );
}
