'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Bell,
  CheckCircle2,
  ExternalLink,
  Gavel,
  Loader2,
  Mail,
  RefreshCcw,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type InboxKind = 'judicial' | 'email' | 'alert';
type InboxItem = {
  kind: InboxKind;
  id: string;
  matter_id: string | null;
  title: string | null;
  snippet: string | null;
  severidad: 'info' | 'alta' | 'critica';
  status: 'unread' | 'read' | 'archived' | 'snoozed';
  ref: string | null;
  source: string | null;
  url: string | null;
  event_date: string | null;
  created_at: string | null;
};

type Counts = {
  judicial_unread: number;
  email_unread: number;
  alerts_unread: number;
  total_unread: number;
  critical: number;
};

const KIND_META: Record<InboxKind, { label: string; icon: JSX.Element; chip: string }> = {
  judicial: {
    label: 'Juzgado',
    icon: <Gavel size={12} aria-hidden="true" />,
    chip: 'border-blue-500/40 text-blue-500',
  },
  email: {
    label: 'Correo',
    icon: <Mail size={12} aria-hidden="true" />,
    chip: 'border-purple-500/40 text-purple-500',
  },
  alert: {
    label: 'Alerta',
    icon: <Bell size={12} aria-hidden="true" />,
    chip: 'border-amber-500/40 text-amber-500',
  },
};

const SEV_META: Record<InboxItem['severidad'], string> = {
  critica: 'border-red-500/50 text-red-500',
  alta: 'border-amber-500/50 text-amber-500',
  info: 'border-line text-ink-2',
};

export function UnifiedInboxFeed() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') params.set('status', 'unread');
      params.set('limit', '50');
      const [feedRes, countsRes] = await Promise.all([
        fetch(`/api/inbox/unified?${params.toString()}`, { cache: 'no-store' }),
        fetch('/api/inbox/counts', { cache: 'no-store' }),
      ]);
      if (feedRes.ok) {
        const data = await feedRes.json();
        setItems(data.items || []);
      }
      if (countsRes.ok) {
        const data = await countsRes.json();
        setCounts(data);
      }
    } catch (e) {
      toast.error('Error cargando inbox');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function markStatus(it: InboxItem, status: 'read' | 'archived') {
    try {
      const res = await fetch(`/api/inbox/${it.kind}/${it.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      void refresh();
    } catch (e) {
      toast.error('No se pudo actualizar');
    }
  }

  async function pollNow() {
    try {
      const res = await fetch('/api/judicial/poll-now', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      toast.success(`Polled: ${data.polled || 0} suscripciones · ${data.inserted || 0} nuevas`);
      void refresh();
    } catch (e) {
      toast.error('Error polling');
    }
  }

  return (
    <section className="surface p-[var(--pad-card)]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="serif text-[16px] font-semibold">Bandeja unificada</h3>
          {counts && (
            <p className="text-[12px] muted">
              {counts.total_unread} sin leer
              {counts.critical > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-red-500">
                  <AlertTriangle size={11} aria-hidden="true" /> {counts.critical} críticos
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
            className="rounded-md border border-line bg-bg-elev px-2 py-1 text-[12.5px]"
          >
            <option value="unread">Sin leer</option>
            <option value="all">Todo</option>
          </select>
          <button className="btn" onClick={pollNow} title="Forzar consulta de novedades judiciales">
            <RefreshCcw size={12} aria-hidden="true" /> Refrescar
          </button>
        </div>
      </header>

      <div className="mt-3 grid gap-2">
        {loading ? (
          <div className="flex items-center gap-2 text-[12.5px] muted">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <div className="text-[12.5px] muted">
            {filter === 'unread' ? 'Sin novedades pendientes.' : 'Sin items en la bandeja.'}
          </div>
        ) : (
          items.map((it) => (
            <article
              key={`${it.kind}:${it.id}`}
              className={cn(
                'flex items-start gap-3 rounded-md border p-3',
                it.status === 'unread' ? 'border-accent/30 bg-bg-elev' : 'border-line bg-bg',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[10.5px] font-semibold',
                  KIND_META[it.kind].chip,
                )}
              >
                {KIND_META[it.kind].icon}
                {KIND_META[it.kind].label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold truncate max-w-[60ch]">{it.title || '—'}</span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                      SEV_META[it.severidad],
                    )}
                  >
                    {it.severidad}
                  </span>
                  {it.ref && <span className="text-[11px] muted mono">{it.ref}</span>}
                </div>
                {it.snippet && (
                  <div className="mt-1 line-clamp-2 text-[12.5px] muted">{it.snippet}</div>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] muted">
                  {it.source && <span>{it.source}</span>}
                  {it.event_date && <span>· {it.event_date}</span>}
                  {it.created_at && <span>· {formatRelative(it.created_at)}</span>}
                  {it.matter_id && (
                    <Link href={`/casos/${it.matter_id}`} className="text-accent hover:underline">
                      Ver caso →
                    </Link>
                  )}
                  {it.url && (
                    <a href={it.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-accent hover:underline">
                      <ExternalLink size={10} aria-hidden="true" /> Fuente
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-none items-center gap-1">
                {it.status === 'unread' && (
                  <button className="btn" onClick={() => markStatus(it, 'read')} title="Marcar leído">
                    <CheckCircle2 size={12} aria-hidden="true" />
                  </button>
                )}
                {it.status !== 'archived' && (
                  <button className="btn" onClick={() => markStatus(it, 'archived')} title="Archivar">
                    <Archive size={12} aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
