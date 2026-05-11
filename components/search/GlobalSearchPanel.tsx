'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Briefcase, FileText, Loader2, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type Item = {
  kind: 'matter' | 'client' | 'document';
  id: string;
  title: string | null;
  snippet: string | null;
  matter_id: string | null;
  client_id: string | null;
  rank: number;
};

const KIND_META: Record<Item['kind'], { label: string; icon: JSX.Element; chip: string; href: (it: Item) => string }> = {
  matter: {
    label: 'Caso',
    icon: <Briefcase size={12} aria-hidden="true" />,
    chip: 'border-blue-500/40 text-blue-500',
    href: (it) => `/casos/${it.id}`,
  },
  client: {
    label: 'Cliente',
    icon: <User size={12} aria-hidden="true" />,
    chip: 'border-purple-500/40 text-purple-500',
    href: (it) => `/clientes/${it.id}`,
  },
  document: {
    label: 'Documento',
    icon: <FileText size={12} aria-hidden="true" />,
    chip: 'border-emerald-500/40 text-emerald-500',
    href: (it) => (it.matter_id ? `/casos/${it.matter_id}?tab=Documentos` : '/documentos'),
  },
};

export function GlobalSearchPanel({ initialQuery = '' }: { initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [kindFilter, setKindFilter] = useState<'all' | Item['kind']>('all');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const txt = q.trim();
    if (txt.length < 2) {
      setItems([]);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(txt)}&limit=50`, {
          cache: 'no-store',
          signal: ctrl.signal,
        });
        if (r.ok) {
          const d = await r.json();
          setItems(d.items || []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<Item['kind'], Item[]> = { matter: [], client: [], document: [] };
    items.forEach((it) => g[it.kind].push(it));
    return g;
  }, [items]);

  const visible = useMemo(() => {
    if (kindFilter === 'all') return items;
    return items.filter((it) => it.kind === kindFilter);
  }, [items, kindFilter]);

  return (
    <div className="grid gap-4">
      <div className="surface flex items-center gap-2 p-3">
        <Search size={16} className="text-ink-3" aria-hidden="true" />
        <input
          autoFocus
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca un caso, cliente, expediente, documento…"
          className="flex-1 bg-transparent text-[14px] outline-none"
        />
        {loading && <Loader2 size={14} className="animate-spin muted" aria-hidden="true" />}
      </div>

      {items.length > 0 && (
        <div className="flex items-center gap-2 text-[12px]">
          <span className="muted">Filtrar:</span>
          {(['all', 'matter', 'client', 'document'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={cn(
                'rounded-md px-2 py-0.5 font-medium border',
                kindFilter === k ? 'border-accent text-accent' : 'border-line text-ink-2',
              )}
            >
              {k === 'all' ? `Todo (${items.length})` :
                k === 'matter' ? `Casos (${grouped.matter.length})` :
                k === 'client' ? `Clientes (${grouped.client.length})` :
                `Documentos (${grouped.document.length})`}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-2">
        {q.trim().length < 2 && (
          <div className="surface p-6 text-center muted text-[12.5px]">
            Escribe al menos 2 caracteres para buscar.
          </div>
        )}
        {q.trim().length >= 2 && !loading && visible.length === 0 && (
          <div className="surface p-6 text-center muted text-[12.5px]">
            Sin resultados para <strong>{q}</strong>.
          </div>
        )}
        {visible.map((it) => {
          const meta = KIND_META[it.kind];
          return (
            <Link
              key={`${it.kind}:${it.id}`}
              href={meta.href(it)}
              className="surface flex items-start gap-3 p-3 transition-colors hover:border-accent"
            >
              <span
                className={cn(
                  'inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[10.5px] font-semibold',
                  meta.chip,
                )}
              >
                {meta.icon}
                {meta.label}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold">{it.title || '—'}</div>
                {it.snippet && <div className="line-clamp-2 text-[12px] muted">{it.snippet}</div>}
              </div>
              <span className="text-[10.5px] muted">rank {it.rank.toFixed(2)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
