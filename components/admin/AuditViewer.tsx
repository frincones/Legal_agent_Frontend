'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Filter, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type LogRow = {
  id: number;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  outcome: 'success' | 'denied' | 'error';
  reason: string | null;
  data_subject_id: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string | null;
};

type Counts = {
  total: number;
  denied: number;
  by_action: Array<{ action: string; count: number }>;
  days: number;
};

export function AuditViewer() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [days, setDays] = useState(7);
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    data_subject_id: '',
    outcome: '',
    user_id: '',
  });
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    q.set('limit', '200');
    for (const [k, v] of Object.entries(filters)) {
      if (v) q.set(k, v);
    }
    return q.toString();
  }, [filters]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [logs, c] = await Promise.all([
        fetch(`/api/audit/logs?${queryString}`, { cache: 'no-store' }),
        fetch(`/api/audit/counts?days=${days}`, { cache: 'no-store' }),
      ]);
      if (logs.ok) setRows((await logs.json()).items || []);
      if (c.ok) setCounts(await c.json());
    } catch (e) {
      toast.error('Error cargando audit log');
    } finally {
      setLoading(false);
    }
  }, [queryString, days]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function exportHabeas() {
    const sid = filters.data_subject_id.trim();
    if (!sid) {
      toast.message('Filtra primero por "Titular del dato"');
      return;
    }
    const url = `/api/audit/habeas-data/${encodeURIComponent(sid)}?format=csv`;
    window.location.href = url;
  }

  return (
    <div className="grid gap-4">
      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Eventos" v={counts?.total ?? 0} icon={<ShieldCheck size={14} className="text-emerald-500" aria-hidden="true" />} />
        <Stat label="Denegados" v={counts?.denied ?? 0} icon={<ShieldAlert size={14} className="text-red-500" aria-hidden="true" />} />
        <Stat label="Días" v={days} icon={<Filter size={14} className="muted" aria-hidden="true" />} />
      </div>

      {/* Filters */}
      <div className="surface flex flex-wrap items-end gap-2 p-3">
        <Field label="Acción">
          <input
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            placeholder="client.read"
            className="w-[160px] bg-transparent outline-none"
          />
        </Field>
        <Field label="Tipo recurso">
          <input
            value={filters.resource_type}
            onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
            placeholder="client / matter / document"
            className="w-[180px] bg-transparent outline-none"
          />
        </Field>
        <Field label="Titular dato (NIT/CC)">
          <input
            value={filters.data_subject_id}
            onChange={(e) => setFilters({ ...filters, data_subject_id: e.target.value })}
            placeholder="900.123.456-7"
            className="w-[180px] bg-transparent outline-none"
          />
        </Field>
        <Field label="Resultado">
          <select
            value={filters.outcome}
            onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}
            className="bg-transparent outline-none"
          >
            <option value="">Todos</option>
            <option value="success">Éxito</option>
            <option value="denied">Denegado</option>
            <option value="error">Error</option>
          </select>
        </Field>
        <Field label="Días">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="bg-transparent outline-none"
          >
            <option value={1}>1</option>
            <option value={7}>7</option>
            <option value={30}>30</option>
            <option value={90}>90</option>
          </select>
        </Field>
        <button className="btn btn-primary ml-auto" onClick={() => void refresh()}>
          Aplicar filtros
        </button>
        <button className="btn" onClick={exportHabeas} title="Export Habeas Data (CSV)">
          <Download size={12} aria-hidden="true" /> Habeas Data
        </button>
      </div>

      {/* Table */}
      <div className="surface overflow-x-auto p-2">
        {loading ? (
          <div className="flex items-center gap-2 p-3 text-[12.5px] muted">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-3 text-[12.5px] muted">Sin eventos para estos filtros.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider muted">
                <th className="py-2">Cuándo</th>
                <th className="py-2">Acción</th>
                <th className="py-2">Recurso</th>
                <th className="py-2">Titular</th>
                <th className="py-2">Usuario</th>
                <th className="py-2">IP</th>
                <th className="py-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line text-[12.5px]">
                  <td className="py-2 muted whitespace-nowrap">{r.occurred_at ? formatRelative(r.occurred_at) : '—'}</td>
                  <td className="py-2 mono">{r.action}</td>
                  <td className="py-2">{r.resource_type ? `${r.resource_type}/${r.resource_id ?? ''}` : '—'}</td>
                  <td className="py-2 mono">{r.data_subject_id || '—'}</td>
                  <td className="py-2 mono">{r.user_id ? r.user_id.slice(0, 8) : '—'}</td>
                  <td className="py-2 mono">{r.ip_address || '—'}</td>
                  <td className="py-2">
                    <span
                      className={cn(
                        'chip',
                        r.outcome === 'success' && 'chip-green',
                        r.outcome === 'denied' && 'chip-amber',
                        r.outcome === 'error' && 'chip-red',
                      )}
                    >
                      {r.outcome}
                    </span>
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

function Stat({ label, v, icon }: { label: string; v: number; icon: JSX.Element }) {
  return (
    <div className="surface p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider muted">
        {icon}
        {label}
      </div>
      <div className="serif text-[22px] font-semibold">{v}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wider muted">{label}</label>
      <div className="rounded-md border border-line bg-bg-elev p-[6px_8px] text-[12.5px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
