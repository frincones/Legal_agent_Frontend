'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Clock, Loader2, Plus, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TimerWidget } from './TimerWidget';
import { TrustBalanceCard } from '@/components/trust/TrustBalanceCard';
import { cn, formatCOP, formatRelative } from '@/lib/utils';
import { useDataChangeRefresh } from '@/lib/hooks/useDataChangeRefresh';

type TimeEntry = {
  id: string;
  matter_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_min: number;
  billable: boolean;
  rate_cop: number | null;
  description: string;
  source: string;
  invoiced: boolean;
};

type Expense = {
  id: string;
  matter_id: string;
  user_id: string | null;
  kind: string;
  amount_cop: number;
  occurred_on: string | null;
  description: string;
  billable: boolean;
  invoiced: boolean;
};

type Summary = {
  time_minutes: number;
  time_amount: number;
  time_entries: number;
  expense_amount: number;
  expense_count: number;
  subtotal: number;
};

export function HorasGastosTab({ matterId }: { matterId: string }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [openManual, setOpenManual] = useState(false);
  const [openExpense, setOpenExpense] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [te, ex, sm] = await Promise.all([
        fetch(`/api/time-entries?matter_id=${matterId}&limit=200`, { cache: 'no-store' }),
        fetch(`/api/expenses?matter_id=${matterId}&limit=200`, { cache: 'no-store' }),
        fetch(`/api/time-entries/summary?matter_id=${matterId}`, { cache: 'no-store' }),
      ]);
      if (te.ok) setEntries((await te.json()).items || []);
      if (ex.ok) setExpenses((await ex.json()).items || []);
      if (sm.ok) setSummary(await sm.json());
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Refresca cuando el agente registra horas/gastos o cambia trust del matter.
  useDataChangeRefresh(
    ['time_entries', 'expenses', 'trust_transactions', 'invoices'],
    refresh,
    { matterId },
  );

  async function deleteEntry(id: string) {
    if (!confirm('¿Eliminar entrada?')) return;
    const r = await fetch(`/api/time-entries/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Eliminada'); void refresh(); }
  }

  async function deleteExpense(id: string) {
    if (!confirm('¿Eliminar gasto?')) return;
    const r = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Eliminado'); void refresh(); }
  }

  if (loading && entries.length === 0 && expenses.length === 0) {
    return (
      <div className="surface flex items-center gap-2 p-4 text-[12.5px] muted">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {/* Timer */}
      <TimerWidget matterId={matterId} onChange={refresh} />

      {/* Trust balance · Sprint 10 */}
      <TrustBalanceCard matterId={matterId} />

      {/* Summary */}
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="Horas no facturadas" v={`${((summary?.time_minutes ?? 0) / 60).toFixed(1)} h`} icon={<Clock size={14} className="text-blue-500" aria-hidden="true" />} />
        <Stat label="Importe horas" v={formatCOP(summary?.time_amount ?? 0)} icon={<Clock size={14} className="text-emerald-500" aria-hidden="true" />} />
        <Stat label="Gastos no facturados" v={formatCOP(summary?.expense_amount ?? 0)} icon={<Receipt size={14} className="text-amber-500" aria-hidden="true" />} />
      </div>

      {/* Entries */}
      <section className="surface p-3">
        <header className="mb-2 flex items-center justify-between">
          <h3 className="serif text-[14px] font-semibold">Horas registradas</h3>
          <button className="btn" onClick={() => setOpenManual(true)}>
            <Plus size={12} aria-hidden="true" /> Manual
          </button>
        </header>
        {entries.length === 0 ? (
          <div className="p-3 text-[12.5px] muted">Aún no hay horas registradas en este caso.</div>
        ) : (
          <ul className="grid gap-1.5">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center gap-2 rounded-md border border-line p-2.5 text-[12.5px]">
                <span className={cn(
                  'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                  e.invoiced ? 'border-purple-500/40 text-purple-500' :
                  e.billable ? 'border-emerald-500/40 text-emerald-500' :
                  'border-line text-ink-3',
                )}>
                  {e.invoiced ? 'Facturada' : e.billable ? 'Facturable' : 'No fact.'}
                </span>
                <span className="mono w-12 text-right">{(e.duration_min / 60).toFixed(2)}h</span>
                <span className="flex-1 truncate">{e.description || '—'}</span>
                <span className="muted">{e.started_at ? formatRelative(e.started_at) : ''}</span>
                {!e.invoiced && (
                  <button className="btn" onClick={() => deleteEntry(e.id)} title="Eliminar">
                    <Trash2 size={12} className="text-red-500" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Expenses */}
      <section className="surface p-3">
        <header className="mb-2 flex items-center justify-between">
          <h3 className="serif text-[14px] font-semibold">Gastos</h3>
          <button className="btn" onClick={() => setOpenExpense(true)}>
            <Plus size={12} aria-hidden="true" /> Gasto
          </button>
        </header>
        {expenses.length === 0 ? (
          <div className="p-3 text-[12.5px] muted">Sin gastos registrados.</div>
        ) : (
          <ul className="grid gap-1.5">
            {expenses.map((ex) => (
              <li key={ex.id} className="flex items-center gap-2 rounded-md border border-line p-2.5 text-[12.5px]">
                <span className={cn(
                  'inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                  ex.invoiced ? 'border-purple-500/40 text-purple-500' :
                  ex.billable ? 'border-emerald-500/40 text-emerald-500' :
                  'border-line text-ink-3',
                )}>
                  {ex.invoiced ? 'Facturado' : ex.billable ? 'Facturable' : 'No fact.'}
                </span>
                <span className="font-semibold">{ex.kind}</span>
                <span className="flex-1 truncate muted">{ex.description}</span>
                <span className="mono">{formatCOP(ex.amount_cop)}</span>
                <span className="muted">{ex.occurred_on}</span>
                {!ex.invoiced && (
                  <button className="btn" onClick={() => deleteExpense(ex.id)} title="Eliminar">
                    <Trash2 size={12} className="text-red-500" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ManualEntryDialog open={openManual} onOpenChange={setOpenManual} matterId={matterId} onCreated={refresh} />
      <ExpenseDialog open={openExpense} onOpenChange={setOpenExpense} matterId={matterId} onCreated={refresh} />
    </div>
  );
}

function Stat({ label, v, icon }: { label: string; v: React.ReactNode; icon: JSX.Element }) {
  return (
    <div className="surface p-3">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider muted">{icon} {label}</div>
      <div className="serif text-[18px] font-semibold">{v}</div>
    </div>
  );
}

function ManualEntryDialog({ open, onOpenChange, matterId, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; matterId: string; onCreated: () => void }) {
  const [minutes, setMinutes] = useState(30);
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matter_id: matterId, duration_min: minutes, description, billable, source: 'manual' }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success('Hora registrada');
      onCreated();
      onOpenChange(false);
      setMinutes(30); setDescription('');
    } catch (e) {
      toast.error('Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 surface p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Registrar hora manual</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Minutos">
              <input type="number" min={1} max={1440} required value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value) || 0)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Descripción">
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Análisis de contrato…" className="w-full bg-transparent outline-none" />
            </Field>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
              Facturable
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
                Crear
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ExpenseDialog({ open, onOpenChange, matterId, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; matterId: string; onCreated: () => void }) {
  const [kind, setKind] = useState('desplazamiento');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matter_id: matterId, kind, amount_cop: amount, occurred_on: date, description, billable }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success('Gasto registrado');
      onCreated();
      onOpenChange(false);
      setAmount(0); setDescription('');
    } catch (e) {
      toast.error('Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 surface p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Registrar gasto</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Tipo">
              <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full bg-transparent outline-none">
                <option value="desplazamiento">Desplazamiento</option>
                <option value="copias">Copias</option>
                <option value="aranceles">Aranceles</option>
                <option value="peritaje">Peritaje</option>
                <option value="notariado">Notariado</option>
                <option value="viaticos">Viáticos</option>
                <option value="otro">Otro</option>
              </select>
            </Field>
            <Field label="Monto (COP)">
              <input type="number" min={0} step={100} required value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Fecha">
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Descripción">
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
              Reembolsable
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
                Crear
              </button>
            </div>
          </form>
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
