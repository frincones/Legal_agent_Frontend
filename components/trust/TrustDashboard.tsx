'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn, formatCOP } from '@/lib/utils';
import { AlertTriangle, Banknote, CheckCircle2, Loader2, Plus, RefreshCcw, Wallet } from 'lucide-react';
import { AccountsList } from './AccountsList';
import { TransactionsList } from './TransactionsList';
import { BankReconciliation } from './BankReconciliation';

type Summary = {
  accounts_count: number;
  opening_total_cop: number;
  total_in_cop: number;
  total_out_cop: number;
  current_balance_cop: number;
  unreconciled_count: number;
  by_matter_balance: Record<string, number>;
};

export function TrustDashboard() {
  const [tab, setTab] = useState<'accounts' | 'transactions' | 'reconciliation'>('accounts');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSummary = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/trust/summary', { cache: 'no-store' });
      if (r.ok) setSummary(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshSummary(); }, [refreshSummary]);

  return (
    <div className="grid gap-4">
      {/* Summary tiles */}
      <div className="grid gap-3 md:grid-cols-4">
        <Tile label="Cuentas activas" v={summary?.accounts_count ?? 0} icon={<Wallet size={14} className="text-accent" aria-hidden="true" />} />
        <Tile label="Balance actual" v={loading ? '…' : formatCOP(summary?.current_balance_cop ?? 0)} icon={<Banknote size={14} className="text-emerald-500" aria-hidden="true" />} highlight />
        <Tile label="Total entrado" v={loading ? '…' : formatCOP(summary?.total_in_cop ?? 0)} icon={<Banknote size={14} className="text-blue-500" aria-hidden="true" />} />
        <Tile
          label="Sin conciliar"
          v={summary?.unreconciled_count ?? 0}
          icon={summary?.unreconciled_count
            ? <AlertTriangle size={14} className="text-amber-500" aria-hidden="true" />
            : <CheckCircle2 size={14} className="text-emerald-500" aria-hidden="true" />
          }
          variant={summary?.unreconciled_count ? 'warning' : 'ok'}
        />
      </div>

      {/* Compliance disclaimer */}
      <div className="surface border-blue-500/30 bg-blue-500/5 p-3 text-[12px]">
        <strong>Cuentas fiduciarias · Ley 1123/2007 CO.</strong> Los fondos depositados aquí son
        propiedad del cliente, segregados del patrimonio del despacho. Cada movimiento queda
        auditado y se concilia mensualmente con el extracto bancario.
      </div>

      {/* Tabs */}
      <nav className="surface flex flex-wrap gap-1 p-1" aria-label="Trust tabs">
        {([
          { id: 'accounts', label: 'Cuentas' },
          { id: 'transactions', label: 'Movimientos' },
          { id: 'reconciliation', label: 'Conciliación' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors',
              tab === t.id ? 'bg-accent text-white' : 'text-ink-2 hover:bg-bg-sunken hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'accounts' && <AccountsList onChange={refreshSummary} />}
      {tab === 'transactions' && <TransactionsList onChange={refreshSummary} />}
      {tab === 'reconciliation' && <BankReconciliation onChange={refreshSummary} />}
    </div>
  );
}

function Tile({
  label, v, icon, highlight, variant,
}: {
  label: string;
  v: React.ReactNode;
  icon: JSX.Element;
  highlight?: boolean;
  variant?: 'ok' | 'warning';
}) {
  return (
    <div className={cn(
      'surface p-3',
      highlight && 'border-accent/30 ring-1 ring-accent/20',
      variant === 'warning' && 'border-amber-500/30',
    )}>
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider muted">{icon} {label}</div>
      <div className="serif text-[20px] font-semibold">{v}</div>
    </div>
  );
}
