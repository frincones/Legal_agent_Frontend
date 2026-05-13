'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Banknote, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCOP } from '@/lib/utils';

type Account = {
  id: string;
  name: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  is_trust: boolean;
  active: boolean;
  opening_balance_cop: number;
  balance_cop: number;
};

export function AccountsList({ onChange }: { onChange?: () => void }) {
  const [items, setItems] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/trust/accounts', { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <div className="grid gap-3">
      <header className="flex items-center justify-between">
        <h3 className="serif text-[15px] font-semibold">Cuentas fiduciarias</h3>
        <button className="btn btn-primary" onClick={() => setOpenCreate(true)}>
          <Plus size={14} aria-hidden="true" /> Nueva cuenta
        </button>
      </header>

      {loading ? (
        <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="surface p-6 text-center text-[12.5px] muted">
          Sin cuentas fiduciarias. Crea una para empezar a manejar dinero de clientes.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {items.map((a) => (
            <article key={a.id} className="surface p-4">
              <div className="flex items-center gap-2">
                <Banknote size={16} className={a.is_trust ? 'text-accent' : 'text-ink-3'} aria-hidden="true" />
                <strong className="text-[13.5px]">{a.name}</strong>
                {a.is_trust && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded border border-accent/30 px-1.5 py-0.5 text-[10.5px] font-semibold text-accent">
                    FIDUCIARIA
                  </span>
                )}
                {!a.active && <span className="ml-auto text-[10.5px] muted">Inactiva</span>}
              </div>
              <div className="mt-1 text-[11.5px] muted">
                {a.bank_name} · ****{a.account_number.slice(-4)} · {a.account_type}
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider muted">Balance vigente</div>
                  <div className="serif text-[20px] font-semibold">{formatCOP(a.balance_cop)}</div>
                </div>
                <div className="text-right text-[10.5px] muted">
                  Apertura: {formatCOP(a.opening_balance_cop)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <CreateDialog open={openCreate} onOpenChange={setOpenCreate} onCreated={() => { void refresh(); onChange?.(); }} />
    </div>
  );
}

function CreateDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('corriente');
  const [opening, setOpening] = useState(0);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/trust/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name, bank_name: bankName, account_number: accountNumber,
          account_type: accountType, opening_balance_cop: opening, is_trust: true,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success('Cuenta creada');
      onCreated();
      onOpenChange(false);
      setName(''); setBankName(''); setAccountNumber(''); setOpening(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 surface p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Nueva cuenta fiduciaria</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Nombre interno">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cuenta clientes Bancolombia" className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Banco">
              <input required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bancolombia" className="w-full bg-transparent outline-none" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Número de cuenta">
                <input required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full bg-transparent outline-none" />
              </Field>
              <Field label="Tipo">
                <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full bg-transparent outline-none">
                  <option value="corriente">Corriente</option>
                  <option value="ahorros">Ahorros</option>
                  <option value="escrow">Escrow</option>
                </select>
              </Field>
            </div>
            <Field label="Saldo de apertura (COP)">
              <input type="number" min={0} step={1000} value={opening} onChange={(e) => setOpening(parseFloat(e.target.value) || 0)} className="w-full bg-transparent outline-none" />
            </Field>
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
      <div className="rounded-md border border-line bg-bg-elev p-[10px] text-[13px] focus-within:border-accent">{children}</div>
    </div>
  );
}
