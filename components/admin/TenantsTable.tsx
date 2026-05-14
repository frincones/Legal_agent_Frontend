'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tenant = {
  firm_id: string;
  razon_social: string;
  country: string;
  firm_created_at: string;
  plan_code: string;
  plan_name: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  users_count: number;
  matters_count: number;
  llm_calls_mtd: number;
  voice_min_mtd: number;
};

const STATUS_BADGE: Record<string, string> = {
  active: 'chip-ok',
  trialing: 'chip-purple',
  past_due: 'chip-bad',
  canceled: 'chip-neutral',
  paused: 'chip-warn',
};

export function TenantsTable() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (planFilter) params.set('plan_code', planFilter);
    if (statusFilter) params.set('status', statusFilter);
    params.set('limit', '50');
    fetch(`/api/admin/tenants?${params}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
      .then((d) => {
        setItems(d.items || []);
        setTotal(d.total || 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [planFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="surface flex flex-wrap items-center gap-2 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            className="input pl-8"
            placeholder="Buscar por razón social…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
          />
        </div>
        <select className="input w-40" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
          <option value="">Todos los planes</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="firm">Firma</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select className="input w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past due</option>
          <option value="canceled">Canceled</option>
          <option value="paused">Paused</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={load}>Buscar</button>
      </div>

      <div className="surface overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-[13px] muted">
            <Loader2 size={14} className="animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-[13px] muted">Sin resultados</div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Razón social</th>
                <th className="px-3 py-2 text-left">Plan</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Usuarios</th>
                <th className="px-3 py-2 text-right">Casos</th>
                <th className="px-3 py-2 text-right">LLM/mes</th>
                <th className="px-3 py-2 text-left">Creada</th>
                <th className="px-3 py-2 text-left">Trial vence</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.firm_id} className="border-t border-line/40 hover:bg-bg-sunken/40">
                  <td className="px-3 py-2">
                    <Link href={`/saas/tenants/${t.firm_id}`} className="font-medium text-accent hover:underline">
                      {t.razon_social}
                    </Link>
                    <div className="text-[10.5px] muted">{t.country?.toUpperCase()} · {t.firm_id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="chip chip-neutral text-[10px]">{t.plan_code}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn('chip text-[10px]', STATUS_BADGE[t.status] || 'chip-neutral')}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{t.users_count}</td>
                  <td className="px-3 py-2 text-right font-mono">{t.matters_count}</td>
                  <td className="px-3 py-2 text-right font-mono">{t.llm_calls_mtd}</td>
                  <td className="px-3 py-2 text-[11px] muted">
                    {new Date(t.firm_created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-3 py-2 text-[11px] muted">
                    {t.trial_ends_at ? new Date(t.trial_ends_at).toLocaleDateString('es-CO') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="text-[11px] muted">Mostrando {items.length} de {total}</div>
    </div>
  );
}
