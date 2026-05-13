'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Banknote, ExternalLink, Loader2 } from 'lucide-react';
import { cn, formatCOP } from '@/lib/utils';

type LedgerEntry = {
  id: string;
  occurred_on: string;
  kind: string;
  direction: 'in' | 'out';
  amount_cop: number;
  description: string;
  payer_payee: string | null;
  reconciled: boolean;
  running_balance_cop: number;
};

const KIND_LABEL: Record<string, string> = {
  deposit: 'Depósito',
  withdrawal: 'Pago',
  fee_transfer: 'Honorarios',
  refund: 'Devolución',
  adjustment: 'Ajuste',
  transfer_in: 'Transfer in',
  transfer_out: 'Transfer out',
};

export function TrustBalanceCard({ matterId }: { matterId: string }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [b, l] = await Promise.all([
        fetch(`/api/trust/matters/${matterId}/balance`, { cache: 'no-store' }),
        fetch(`/api/trust/matters/${matterId}/ledger`, { cache: 'no-store' }),
      ]);
      if (b.ok) {
        const d = await b.json();
        setBalance(d.balance_cop ?? 0);
        setCount(d.transactions_count ?? 0);
      }
      if (l.ok) setLedger(((await l.json()).items || []).slice(-10).reverse());
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <section className="surface p-[var(--pad-card)]">
      <div className="flex items-center justify-between">
        <h3 className="serif m-0 text-[15px] font-semibold inline-flex items-center gap-2">
          <Banknote size={14} className="text-accent" aria-hidden="true" />
          Fondos del cliente en custodia
        </h3>
        <Link href="/trust" className="text-[12px] text-accent hover:underline inline-flex items-center gap-1">
          Ver detalle <ExternalLink size={11} aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : count === 0 ? (
        <div className="mt-2 text-[12.5px] muted">
          Este caso no tiene movimientos fiduciarios. Registra el primer depósito desde <Link href="/trust" className="text-accent hover:underline">Fondos</Link>.
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider muted">Balance actual</div>
              <div className={cn(
                'serif text-[26px] font-semibold',
                (balance ?? 0) < 0 && 'text-red-500',
              )}>
                {formatCOP(balance ?? 0)}
              </div>
            </div>
            <div className="text-right text-[11.5px] muted">{count} movimientos</div>
          </div>
          <ul className="mt-3 grid gap-1">
            {ledger.map((e) => (
              <li key={e.id} className="flex items-center gap-2 border-t border-line/40 pt-1.5 text-[12px]">
                <span className="muted whitespace-nowrap">{e.occurred_on}</span>
                <span className="font-medium">{KIND_LABEL[e.kind] || e.kind}</span>
                <span className="flex-1 truncate muted">{e.description || e.payer_payee || ''}</span>
                <span className={cn('mono font-semibold', e.direction === 'in' ? 'text-emerald-500' : 'text-red-500')}>
                  {e.direction === 'in' ? '+' : '−'}{formatCOP(e.amount_cop)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
