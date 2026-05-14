'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuditRow = {
  id: number; firm_id: string | null; user_id: string | null;
  action: string; resource_type: string | null; resource_id: string | null;
  outcome: string; occurred_at: string;
  metadata: any;
};

export function AuditLogViewer() {
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/metrics/audit-log?limit=200', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;
  if (items.length === 0) return <div className="surface p-6 text-center text-[13px] muted">Sin entradas de auditoría aún.</div>;

  return (
    <div className="surface overflow-hidden">
      <table className="w-full text-[12px]">
        <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
          <tr>
            <th className="px-3 py-2 text-left">Fecha</th>
            <th className="px-3 py-2 text-left">Admin</th>
            <th className="px-3 py-2 text-left">Acción</th>
            <th className="px-3 py-2 text-left">Resource</th>
            <th className="px-3 py-2 text-left">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id} className="border-t border-line/40">
              <td className="px-3 py-2 font-mono text-[10.5px]">
                {new Date(row.occurred_at).toLocaleString('es-CO')}
              </td>
              <td className="px-3 py-2 text-[11px]">
                {row.metadata?.admin_email || row.user_id?.slice(0, 8) || '—'}
                {row.metadata?.admin_role && (
                  <span className="ml-1 chip chip-neutral text-[9px]">{row.metadata.admin_role}</span>
                )}
              </td>
              <td className="px-3 py-2 font-mono text-[11px]">{row.action}</td>
              <td className="px-3 py-2 text-[11px] muted">
                {row.resource_type ? `${row.resource_type}:${row.resource_id?.slice(0, 8) || '?'}` : '—'}
              </td>
              <td className="px-3 py-2">
                <span className={cn('chip text-[10px]',
                  row.outcome === 'success' ? 'chip-ok' :
                  row.outcome === 'denied' ? 'chip-warn' : 'chip-bad'
                )}>{row.outcome}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
