'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Ticket = {
  id: string; firm_id: string | null; firm_name: string | null;
  reporter_email: string; subject: string; category: string;
  status: string; priority: string; assigned_to: string | null;
  assigned_email: string | null; created_at: string; messages_count: number;
};

const STATUS_CLS: Record<string, string> = {
  open: 'chip-warn', in_progress: 'chip-accent',
  waiting_user: 'chip-purple', resolved: 'chip-ok', closed: 'chip-neutral',
};

const PRIORITY_CLS: Record<string, string> = {
  urgent: 'chip-bad', high: 'chip-warn',
  normal: 'chip-neutral', low: 'chip-neutral',
};

export function SupportQueue() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
    params.set('limit', '50');
    fetch(`/api/admin/support/tickets?${params}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="surface flex items-center gap-2 p-3">
        <select className="input w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="waiting_user">Waiting user</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="surface overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-[13px] muted">
            <Loader2 size={14} className="animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-[13px] muted">No hay tickets en este estado</div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Subject</th>
                <th className="px-3 py-2 text-left">Firm</th>
                <th className="px-3 py-2 text-left">Reporter</th>
                <th className="px-3 py-2 text-left">Prio</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Asignado</th>
                <th className="px-3 py-2 text-left">Creado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t border-line/40">
                  <td className="px-3 py-2">
                    <Link href={`/saas/support/${t.id}`} className="font-medium text-accent hover:underline">
                      {t.subject}
                    </Link>
                    <div className="text-[10.5px] muted">
                      {t.category} · {t.messages_count} mensajes
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[11.5px]">{t.firm_name || '—'}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{t.reporter_email}</td>
                  <td className="px-3 py-2">
                    <span className={cn('chip text-[10px]', PRIORITY_CLS[t.priority] || 'chip-neutral')}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn('chip text-[10px]', STATUS_CLS[t.status] || 'chip-neutral')}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[11px] muted">{t.assigned_email || '—'}</td>
                  <td className="px-3 py-2 text-[11px] muted">
                    {new Date(t.created_at).toLocaleDateString('es-CO')}
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
