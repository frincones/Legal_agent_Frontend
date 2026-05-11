'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCOP } from '@/lib/utils';

type MatterOpt = { id: string; titulo: string; expediente: string | null; client_id: string };
type Line = {
  kind: 'time' | 'expense' | 'fixed' | 'discount';
  description: string;
  qty: number;
  unit_price_cop: number;
  total_cop: number;
  time_entry_id?: string | null;
  expense_id?: string | null;
};
type Preview = {
  lines: Line[];
  subtotal_cop: number;
  time_entries_count: number;
  expenses_count: number;
};

export function InvoiceWizard({
  open,
  onOpenChange,
  matters,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  matters: MatterOpt[];
  onCreated: () => void;
}) {
  const [matterId, setMatterId] = useState<string>('');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');
  const [taxPct, setTaxPct] = useState(19);
  const [retencion, setRetencion] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const refreshPreview = useCallback(async () => {
    if (!matterId) {
      setPreview(null);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch('/api/invoices/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matter_id: matterId, since: since || null, until: until || null }),
      });
      if (r.ok) setPreview(await r.json());
    } finally {
      setLoading(false);
    }
  }, [matterId, since, until]);

  useEffect(() => {
    if (open) void refreshPreview();
  }, [open, refreshPreview]);

  const subtotal = preview?.subtotal_cop ?? 0;
  const tax = +(subtotal * taxPct / 100).toFixed(2);
  const total = +(subtotal + tax - retencion).toFixed(2);

  async function onCreate() {
    if (!matterId || !preview?.lines.length) return;
    setCreating(true);
    try {
      const r = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          matter_id: matterId,
          since: since || null,
          until: until || null,
          tax_pct: taxPct,
          retencion_cop: retencion,
          due_date: dueDate || null,
          notes: notes || null,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`Factura ${d.number} creada (draft)`);
      onCreated();
      onOpenChange(false);
      setMatterId(''); setSince(''); setUntil(''); setNotes('');
      setPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[720px] max-w-[94vw] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[17px] font-semibold">Crear factura</Dialog.Title>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Caso">
              <select value={matterId} onChange={(e) => setMatterId(e.target.value)} className="w-full bg-transparent outline-none">
                <option value="">— Selecciona un caso —</option>
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>{m.titulo} {m.expediente ? `(${m.expediente})` : ''}</option>
                ))}
              </select>
            </Field>
            <div />
            <Field label="Desde (opcional)">
              <input type="date" value={since} onChange={(e) => setSince(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Hasta (opcional)">
              <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="IVA (%)">
              <input type="number" min={0} max={50} step={0.1} value={taxPct} onChange={(e) => setTaxPct(parseFloat(e.target.value) || 0)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Retención (COP)">
              <input type="number" min={0} step={1000} value={retencion} onChange={(e) => setRetencion(parseFloat(e.target.value) || 0)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Fecha de vencimiento">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Notas">
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Forma de pago, observaciones…" className="w-full bg-transparent outline-none" />
            </Field>
          </div>

          <div className="mt-4 surface p-3">
            <div className="mb-2 flex items-center justify-between">
              <strong className="text-[13px]">Vista previa</strong>
              <button className="btn" onClick={refreshPreview} disabled={loading || !matterId}>
                {loading ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : 'Refrescar'}
              </button>
            </div>
            {!matterId ? (
              <div className="text-[12.5px] muted">Selecciona un caso para ver las líneas.</div>
            ) : loading ? (
              <div className="text-[12.5px] muted">Calculando…</div>
            ) : !preview || preview.lines.length === 0 ? (
              <div className="text-[12.5px] muted">No hay horas ni gastos facturables en este periodo.</div>
            ) : (
              <>
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                      <th className="py-1">Tipo</th>
                      <th className="py-1">Descripción</th>
                      <th className="py-1 text-right">Cant.</th>
                      <th className="py-1 text-right">Unit.</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.lines.map((l, i) => (
                      <tr key={i} className="border-t border-line/40">
                        <td className="py-1 muted">{l.kind}</td>
                        <td className="py-1 truncate max-w-[260px]">{l.description}</td>
                        <td className="py-1 text-right mono">{l.qty}</td>
                        <td className="py-1 text-right mono">{formatCOP(l.unit_price_cop)}</td>
                        <td className="py-1 text-right mono font-semibold">{formatCOP(l.total_cop)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-[12.5px]">
                  <div>Subtotal</div><div className="text-right mono">{formatCOP(subtotal)}</div>
                  <div>IVA ({taxPct}%)</div><div className="text-right mono">{formatCOP(tax)}</div>
                  <div>Retención</div><div className="text-right mono">-{formatCOP(retencion)}</div>
                  <div className="text-[14px] font-semibold">Total</div><div className="text-right mono text-[14px] font-semibold">{formatCOP(total)}</div>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={onCreate} disabled={creating || !preview?.lines.length}>
              {creating ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <FileText size={12} aria-hidden="true" />}
              Crear factura (draft)
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wider muted">{label}</label>
      <div className="rounded-md border border-line bg-bg-elev p-[10px] text-[13px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
