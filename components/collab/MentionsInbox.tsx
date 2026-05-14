'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AtSign, CheckCheck, Inbox, Loader2 } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';

type Mention = {
  id: string;
  comment_id: string;
  matter_id: string | null;
  matter_document_id: string | null;
  body_preview: string | null;
  mentioned_by: string | null;
  mentioned_by_name: string | null;
  matter_title: string | null;
  read_at: string | null;
  created_at: string | null;
};

export function MentionsInbox({
  className,
  initialFilter = 'unread',
}: {
  className?: string;
  initialFilter?: 'unread' | 'read' | 'all';
}) {
  const [items, setItems] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'unread' | 'read' | 'all'>(initialFilter);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/mentions/inbox?status=${filter}&limit=100`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function markRead(id: string) {
    const r = await fetch(`/api/mentions/${id}/read`, { method: 'POST' });
    if (r.ok) {
      setItems((p) => p.map((m) => m.id === id ? { ...m, read_at: new Date().toISOString() } : m));
    }
  }

  async function markAllRead() {
    const r = await fetch('/api/mentions/read-all', { method: 'POST' });
    if (r.ok) void refresh();
  }

  const unreadCount = items.filter((m) => !m.read_at).length;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {(['unread', 'read', 'all'] as const).map((f) => (
            <button
              key={f}
              className={cn(
                'rounded-md px-2 py-1 text-[11.5px]',
                filter === f ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-bg-sunken',
              )}
              onClick={() => setFilter(f)}
            >
              {f === 'unread' ? `No leídas${unreadCount > 0 ? ` (${unreadCount})` : ''}` : f === 'read' ? 'Leídas' : 'Todo'}
            </button>
          ))}
        </div>
        {unreadCount > 0 && filter !== 'read' && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            <CheckCheck size={12} /> Marcar todas leídas
          </button>
        )}
      </header>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={20} /></div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-8 text-center">
          <Inbox className="mx-auto text-ink-3" size={20} />
          <div className="mt-1 text-[12.5px] muted">Nada por aquí</div>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((m) => (
            <li
              key={m.id}
              className={cn(
                'flex items-start gap-2 rounded-md border border-line bg-bg-elev px-3 py-2',
                !m.read_at && 'ring-1 ring-accent-soft',
              )}
            >
              <AtSign size={14} className="mt-0.5 flex-none text-accent" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-[12.5px] font-semibold">
                    {m.mentioned_by_name || 'Alguien'}
                  </span>
                  <span className="text-[11px] muted">te mencionó</span>
                  {m.matter_id && m.matter_title && (
                    <Link
                      href={`/casos/${m.matter_id}?comment=${m.comment_id}`}
                      className="text-[11px] text-accent hover:underline"
                      onClick={() => !m.read_at && markRead(m.id)}
                    >
                      en "{m.matter_title}"
                    </Link>
                  )}
                  {!m.matter_id && (
                    <Link
                      href={`/actividad?comment=${m.comment_id}`}
                      className="text-[11px] text-accent hover:underline"
                      onClick={() => !m.read_at && markRead(m.id)}
                    >
                      ver
                    </Link>
                  )}
                  <span className="ml-auto text-[10.5px] muted">
                    {m.created_at ? formatRelative(m.created_at) : ''}
                  </span>
                </div>
                {m.body_preview && (
                  <p className="line-clamp-2 text-[12px] text-ink-2">{m.body_preview}</p>
                )}
              </div>
              {!m.read_at && (
                <button
                  className="btn btn-icon btn-ghost btn-sm"
                  onClick={() => markRead(m.id)}
                  aria-label="Marcar como leída"
                  title="Marcar como leída"
                >
                  <CheckCheck size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
