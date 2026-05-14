'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, FileText, MessageCircle, Sparkles, BookOpen,
  Briefcase, Pen, FileCheck, DollarSign, AlertCircle, Loader2,
} from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';

type Event = {
  id: string;
  ts: string | null;
  actor_user_id: string | null;
  actor_name: string | null;
  actor_avatar: string | null;
  kind: string;
  matter_id: string | null;
  matter_document_id: string | null;
  target_kind: string | null;
  target_id: string | null;
  title: string | null;
  preview: string | null;
  payload: Record<string, unknown>;
};

const KIND_ICONS: Record<string, React.ReactNode> = {
  comment_added: <MessageCircle size={14} />,
  comment_resolved: <CheckCircle2 size={14} />,
  comment_edited: <Pen size={14} />,
  doc_uploaded: <FileText size={14} />,
  doc_analyzed: <Sparkles size={14} />,
  matter_status_changed: <Briefcase size={14} />,
  matter_created: <Briefcase size={14} />,
  matter_assigned: <Briefcase size={14} />,
  lesson_extracted: <BookOpen size={14} />,
  lesson_added: <BookOpen size={14} />,
  kb_entry_added: <BookOpen size={14} />,
  kb_entry_pinned: <BookOpen size={14} />,
  event_added: <FileText size={14} />,
  deadline_added: <AlertCircle size={14} />,
  deadline_completed: <CheckCircle2 size={14} />,
  invoice_sent: <DollarSign size={14} />,
  invoice_paid: <DollarSign size={14} />,
  signature_sent: <FileCheck size={14} />,
  signature_signed: <FileCheck size={14} />,
  other: <Sparkles size={14} />,
};

const KIND_LABELS: Record<string, string> = {
  comment_added: 'Comentario',
  comment_resolved: 'Comentario resuelto',
  comment_edited: 'Comentario editado',
  doc_uploaded: 'Documento subido',
  doc_analyzed: 'Documento analizado',
  matter_status_changed: 'Estado del caso',
  matter_created: 'Caso creado',
  matter_assigned: 'Asignación',
  lesson_extracted: 'Lección IA',
  lesson_added: 'Lección manual',
  kb_entry_added: 'Entrada KB',
  kb_entry_pinned: 'KB pinneada',
  event_added: 'Evento',
  deadline_added: 'Plazo',
  deadline_completed: 'Plazo cumplido',
  invoice_sent: 'Factura enviada',
  invoice_paid: 'Factura pagada',
  signature_sent: 'Firma enviada',
  signature_signed: 'Firma completada',
  other: 'Actividad',
};

const FILTER_GROUPS: { label: string; kinds: string[] }[] = [
  { label: 'Comentarios', kinds: ['comment_added', 'comment_resolved', 'comment_edited'] },
  { label: 'Documentos', kinds: ['doc_uploaded', 'doc_analyzed'] },
  { label: 'Casos', kinds: ['matter_created', 'matter_status_changed', 'matter_assigned'] },
  { label: 'Conocimiento', kinds: ['lesson_extracted', 'lesson_added', 'kb_entry_added', 'kb_entry_pinned'] },
  { label: 'Plazos', kinds: ['deadline_added', 'deadline_completed', 'event_added'] },
  { label: 'Facturación', kinds: ['invoice_sent', 'invoice_paid'] },
  { label: 'Firmas', kinds: ['signature_sent', 'signature_signed'] },
];

export function ActivityFeed({
  matterId,
  limit = 80,
  showFilters = true,
  className,
}: {
  matterId?: string | null;
  limit?: number;
  showFilters?: boolean;
  className?: string;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterKinds, setFilterKinds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (matterId) params.set('matter_id', matterId);
      if (filterKinds.length > 0) params.set('kinds', filterKinds.join(','));
      const r = await fetch(`/api/activity?${params.toString()}`, { cache: 'no-store' });
      if (r.ok) setEvents((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [matterId, limit, filterKinds]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Agrupar por día
  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      if (!e.ts) continue;
      const day = e.ts.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [events]);

  function toggleGroup(kinds: string[]) {
    setFilterKinds((p) => {
      const allActive = kinds.every((k) => p.includes(k));
      if (allActive) return p.filter((k) => !kinds.includes(k));
      return [...new Set([...p, ...kinds])];
    });
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {showFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterKinds([])}
            className={cn(
              'rounded-md px-2 py-1 text-[11.5px]',
              filterKinds.length === 0 ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-bg-sunken',
            )}
          >
            Todo
          </button>
          {FILTER_GROUPS.map((g) => {
            const active = g.kinds.every((k) => filterKinds.includes(k));
            return (
              <button
                key={g.label}
                onClick={() => toggleGroup(g.kinds)}
                className={cn(
                  'rounded-md px-2 py-1 text-[11.5px]',
                  active ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-bg-sunken',
                )}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={20} /></div>
      ) : grouped.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-8 text-center text-[12.5px] muted">
          Sin actividad reciente
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {grouped.map(([day, dayEvents]) => (
            <li key={day}>
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
                {formatDayLabel(day)}
              </div>
              <ul className="flex flex-col gap-1.5">
                {dayEvents.map((e) => (
                  <li
                    key={e.id}
                    className="grid grid-cols-[24px_1fr_auto] items-start gap-2 rounded-md border border-line bg-bg-elev px-2.5 py-2"
                  >
                    <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-bg-sunken text-ink-3">
                      {KIND_ICONS[e.kind] || KIND_ICONS.other}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <span className="text-[12.5px] font-medium">
                          {e.actor_name || 'Sistema'}
                        </span>
                        <span className="text-[11px] muted">{e.title || KIND_LABELS[e.kind] || e.kind}</span>
                        {e.matter_id && (
                          <Link
                            href={`/casos/${e.matter_id}`}
                            className="text-[11px] text-accent hover:underline"
                          >
                            ver caso
                          </Link>
                        )}
                      </div>
                      {e.preview && (
                        <p className="line-clamp-2 text-[12px] text-ink-2">{e.preview}</p>
                      )}
                    </div>
                    <span className="mt-0.5 text-[10.5px] muted">
                      {e.ts ? formatRelative(e.ts) : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDayLabel(day: string): string {
  const d = new Date(day + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getTime() === today.getTime()) return 'Hoy';
  if (d.getTime() === yesterday.getTime()) return 'Ayer';
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}
