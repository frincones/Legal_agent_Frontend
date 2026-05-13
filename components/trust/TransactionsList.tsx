'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Loader2, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCOP, formatRelative } from '@/lib/utils';

type Tx = {
  id: string;
  trust_account_id: string;
  matter_id: string | null;
  client_id: string | null;
  kind: string;
  amount_cop: number;
  direction: 'in' | 'out';
  occurred_on: string | null;
  description: string;
  reference: string | null;
  payer_payee: string | null;
  reconciled: boolean;
};
type Account = { id: string; name: string; bank_name: string; is_trust: boolean; active: boolean };
type Matter = { id: string; titulo: string; expediente: string | null };

const KIND_LABEL: Record<string, string> = {
  deposit: 'Depósito',
  withdrawal: 'Pago a tercero',
  fee_transfer: 'Transfer a honorarios',
  refund: 'Devolución cliente',
  adjustment: 'Ajuste',
  transfer_in: 'Transfer entrada',
  transfer_out: 'Transfer salida',
};

export function TransactionsList({ onChange }: { onChange?: () => void }) {
  const [items, setItems] = useState<Tx[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountFilter, setAccountFilter] = useState('');
  const [matterFilter, setMatterFilter] = useState('');
  const [openCreate, setOpenCreate] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: '200' });
      if (accountFilter) q.set('trust_account_id', accountFilter);
      if (matterFilter) q.set('matter_id', matterFilter);
      const [tx, ac] = await Promise.all([
        fetch(`/api/trust/transactions?${q.toString()}`, { cache: 'no-store' }),
        fetch('/api/trust/accounts', { cache: 'no-store' }),
      ]);
      if (tx.ok) setItems((await tx.json()).items || []);
      if (ac.ok) setAccounts((await ac.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [accountFilter, matterFilter]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Fetch matters for filter / form
  useEffect(() => {
    fetch('/api/matters?limit=200', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setMatters((d.items || []).map((m: any) => ({
        id: m.id, titulo: m.titulo, expediente: m.expediente,
      }))))
      .catch(() => {});
  }, []);

  async function reverse(tx: Tx) {
    const reason = window.prompt('Motivo de la reversa:');
    if (!reason || reason.trim().length < 4) return;
    const r = await fetch(`/api/trust/transactions/${tx.id}/reverse`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    if (r.ok) { toast.success('Reversa registrada'); void refresh(); onChange?.(); }
    else toast.error('Error');
  }

  return (
    <div className="grid gap-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="serif text-[15px] font-semibold">Movimientos</h3>
          <p className="text-[12px] muted">Cada movimiento queda auditado y conciliable con extracto.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="rounded-md border border-line bg-bg-elev px-2 py-1 text-[12px]">
            <option value="">Todas las cuentas</option>
            {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
          <select value={matterFilter} onChange={(e) => setMatterFilter(e.target.value)} className="rounded-md border border-line bg-bg-elev px-2 py-1 text-[12px]">
            <option value="">Todos los casos</option>
            {matters.map((m) => (<option key={m.id} value={m.id}>{m.titulo}</option>))}
          </select>
          <button className="btn btn-primary" onClick={() => setOpenCreate(true)}>
            <Plus size={12} aria-hidden="true" /> Movimiento
          </button>
        </div>
      </header>

      <div className="surface overflow-x-auto p-2">
        {loading ? (
          <div className="flex items-center gap-2 p-3 text-[12.5px] muted">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="p-3 text-[12.5px] muted">Sin movimientos.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                <th className="py-2">Fecha</th>
                <th className="py-2">Tipo</th>
                <th className="py-2">Descripción</th>
                <th className="py-2">Caso</th>
                <th className="py-2 text-right">Monto</th>
                <th className="py-2">Estado</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => {
                const m = matters.find((x) => x.id === t.matter_id);
                return (
                  <tr key={t.id} className="border-t border-line text-[12.5px]">
                    <td className="py-2 muted whitespace-nowrap">{t.occurred_on}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1">
                        {t.direction === 'in'
                          ? <ArrowDownCircle size={12} className="text-emerald-500" aria-hidden="true" />
                          : <ArrowUpCircle size={12} className="text-red-500" aria-hidden="true" />}
                        {KIND_LABEL[t.kind] || t.kind}
                      </span>
                    </td>
                    <td className="py-2 truncate max-w-[280px]">{t.description || (t.payer_payee ? `→ ${t.payer_payee}` : '—')}</td>
                    <td className="py-2 truncate max-w-[140px]">{m ? m.titulo : '—'}</td>
                    <td className={cn('py-2 text-right mono font-semibold', t.direction === 'in' ? 'text-emerald-500' : 'text-red-500')}>
                      {t.direction === 'in' ? '+' : '−'}{formatCOP(t.amount_cop)}
                    </td>
                    <td className="py-2">
                      {t.reconciled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500 text-[10.5px]">
                          <CheckCircle2 size={11} aria-hidden="true" /> Conciliada
                        </span>
                      ) : (
                        <span className="text-[10.5px] muted">Pendiente</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <button className="btn" onClick={() => reverse(t)} title="Reversar">
                        <RotateCcw size={11} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <CreateDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        accounts={accounts}
        matters={matters}
        onCreated={() => { void refresh(); onChange?.(); }}
      />
    </div>
  );
}

function CreateDialog({
  open, onOpenChange, accounts, matters, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accounts: Account[];
  matters: Matter[];
  onCreated: () => void;
}) {
  const [trustAccountId, setTrustAccountId] = useState(accounts[0]?.id || '');
  const [kind, setKind] = useState('deposit');
  const [matterId, setMatterId] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [payerPayee, setPayerPayee] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && accounts[0]?.id) setTrustAccountId(accounts[0].id);
  }, [open, accounts]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/trust/transactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          trust_account_id: trustAccountId,
          kind, matter_id: matterId || null,
          amount_cop: amount, occurred_on: date,
          description, payer_payee: payerPayee || null,
          reference: reference || null,
        }),
      });
      if (!r.ok) {
        const txt = await r.text();
        try {
          const json = JSON.parse(txt);
          throw new Error(json.detail || json.message || txt);
        } catch {
          throw new Error(txt.slice(0, 250));
        }
      }
      toast.success('Movimiento registrado');
      onCreated();
      onOpenChange(false);
      setAmount(0); setDescription(''); setPayerPayee(''); setReference('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[480px] max-w-[92vw] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Nuevo movimiento fiduciario</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Cuenta">
              <select required value={trustAccountId} onChange={(e) => setTrustAccountId(e.target.value)} className="w-full bg-transparent outline-none">
                {accounts.filter((a) => a.active).map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Tipo">
                <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full bg-transparent outline-none">
                  <option value="deposit">Depósito del cliente</option>
                  <option value="withdrawal">Pago a tercero (perito, arancel...)</option>
                  <option value="fee_transfer">Cobro honorarios (transfer a operating)</option>
                  <option value="refund">Devolución al cliente</option>
                  <option value="transfer_in">Transfer entrada</option>
                  <option value="transfer_out">Transfer salida</option>
                </select>
              </Field>
              <Field label="Monto (COP)">
                <input type="number" required min={1} step={100} value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="w-full bg-transparent outline-none" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Caso (opcional)">
                <select value={matterId} onChange={(e) => setMatterId(e.target.value)} className="w-full bg-transparent outline-none">
                  <option value="">— sin caso —</option>
                  {matters.map((m) => (<option key={m.id} value={m.id}>{m.titulo}</option>))}
                </select>
              </Field>
              <Field label="Fecha">
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent outline-none" />
              </Field>
            </div>
            <Field label="Descripción">
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={kind === 'deposit' || kind === 'transfer_in' ? 'Quién paga' : 'Beneficiario'}>
                <input value={payerPayee} onChange={(e) => setPayerPayee(e.target.value)} className="w-full bg-transparent outline-none" />
              </Field>
              <Field label="Referencia (cheque, transfer)">
                <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full bg-transparent outline-none" />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy || !trustAccountId || amount <= 0}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
                Registrar
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
      <div className="rounded-md border border-line bg-bg-elev p-[10px] text-[13px] focus-within:border-accent">{children}</div>
    </div>
  );
}
