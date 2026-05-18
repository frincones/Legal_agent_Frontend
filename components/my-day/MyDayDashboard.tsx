'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AtSign, Calendar, CheckCircle2, Circle, Flag, Loader2,
  MessageCircle, Sparkles, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';
import { useDataChangeRefresh } from '@/lib/hooks/useDataChangeRefresh';

type TaskItem = {
  id: string;
  title: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: string;
  due_at: string | null;
  matter_id: string | null;
};
type Deadline = {
  id: string;
  titulo: string;
  fecha: string | null;
  tipo: string | null;
  matter_id: string | null;
};
type MentionItem = {
  id: string;
  comment_id: string;
  body_preview: string;
  matter_id: string | null;
  created_at: string;
};
type CommentItem = {
  id: string;
  body: string;
  matter_id: string | null;
  created_at: string;
};
type PredItem = {
  matter_id: string | null;
  primary_outcome: string;
  prob_won: number;
  confidence: number;
  generated_at: string;
};
type MyDay = {
  now: string;
  horizon_until: string;
  tasks_open: TaskItem[];
  tasks_open_count: number;
  deadlines_upcoming: Deadline[];
  mentions_unread: MentionItem[];
  mentions_unread_count: number;
  comments_open_assigned: CommentItem[];
  predictions_recent: PredItem[];
};

const PRIORITY_COLORS = {
  low: 'text-ink-3',
  normal: 'text-ink-2',
  high: 'text-warn',
  urgent: 'text-danger',
} as const;

export function MyDayDashboard() {
  const [data, setData] = useState<MyDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState(7);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/my-day?horizon_days=${horizon}`, { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [horizon]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Refresca My Day cuando el agente toca tasks, deadlines, comments,
  // mentions o predictions vía tool.
  useDataChangeRefresh(
    ['tasks', 'deadlines', 'comments', 'predictions'],
    refresh,
  );

  async function completeTask(id: string) {
    const r = await fetch(`/api/tasks/${id}/complete`, { method: 'POST' });
    if (r.ok) {
      toast.success('Tarea completada');
      void refresh();
    }
  }

  async function markRead(mentionId: string) {
    const r = await fetch(`/api/mentions/${mentionId}/read`, { method: 'POST' });
    if (r.ok) void refresh();
  }

  if (loading) {
    return (
      <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={24} /></div>
    );
  }
  if (!data) {
    return <div className="text-[12.5px] muted">Sin datos disponibles.</div>;
  }

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="serif text-[16px] font-semibold">Tu día</h2>
          <p className="text-[12px] muted">
            Pendientes, plazos, menciones y comentarios donde apareces · próximos {horizon} días
          </p>
        </div>
        <select
          className="input w-auto text-[12px]"
          value={horizon}
          onChange={(ev) => setHorizon(parseInt(ev.target.value))}
        >
          <option value="3">3 días</option>
          <option value="7">7 días</option>
          <option value="14">14 días</option>
          <option value="30">30 días</option>
        </select>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label="Tareas abiertas" value={data.tasks_open_count} icon={<Circle size={14} />} tone="default" />
        <Kpi label="Plazos próximos" value={data.deadlines_upcoming?.length || 0} icon={<Calendar size={14} />} tone="warn" />
        <Kpi label="Menciones sin leer" value={data.mentions_unread_count} icon={<AtSign size={14} />} tone="accent" />
        <Kpi label="Comments asignados" value={data.comments_open_assigned?.length || 0} icon={<MessageCircle size={14} />} tone="default" />
      </div>

      {/* Two-column main */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tareas */}
        <Section
          title="Mis tareas"
          icon={<Circle size={14} className="text-ink-3" />}
          link={{ href: '/tareas', label: 'Ver todas' }}
        >
          {data.tasks_open?.length ? (
            <ul className="flex flex-col gap-1">
              {data.tasks_open.slice(0, 8).map((t) => {
                const overdue = t.due_at && new Date(t.due_at) < new Date();
                return (
                  <li key={t.id} className="flex items-start gap-2 rounded-md border border-line bg-bg-elev px-2.5 py-1.5">
                    <button onClick={() => completeTask(t.id)} className="mt-0.5 text-ink-3 hover:text-accent" aria-label="Completar">
                      <Circle size={14} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium">{t.title}</div>
                      <div className="flex items-center gap-1.5 text-[10.5px] muted">
                        <Flag size={9} className={PRIORITY_COLORS[t.priority]} />
                        <span className={PRIORITY_COLORS[t.priority]}>{t.priority}</span>
                        {t.due_at && (
                          <>
                            <span>·</span>
                            <span className={cn(overdue && 'text-danger')}>{formatRelative(t.due_at)}</span>
                          </>
                        )}
                        {t.matter_id && (
                          <>
                            <span>·</span>
                            <Link href={`/casos/${t.matter_id}`} className="text-accent hover:underline">
                              ver caso
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyHint text="Sin tareas pendientes · 🌟" />
          )}
        </Section>

        {/* Plazos */}
        <Section
          title="Plazos próximos"
          icon={<Calendar size={14} className="text-warn" />}
          link={{ href: '/calendario', label: 'Ver calendario' }}
        >
          {data.deadlines_upcoming?.length ? (
            <ul className="flex flex-col gap-1">
              {data.deadlines_upcoming.slice(0, 8).map((d) => {
                const days = d.fecha ? Math.round((new Date(d.fecha).getTime() - Date.now()) / 86400000) : 0;
                const tone = days <= 1 ? 'text-danger' : days <= 5 ? 'text-warn' : 'text-ink-2';
                return (
                  <li key={d.id} className="flex items-start gap-2 rounded-md border border-line bg-bg-elev px-2.5 py-1.5">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-bg-sunken text-ink-3">
                      <Calendar size={12} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium">{d.titulo}</div>
                      <div className="text-[10.5px] muted">
                        <span className={tone}>
                          {d.fecha ? new Date(d.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
                          {' · '}
                          {days >= 0 ? `en ${days} días` : `vencido hace ${Math.abs(days)} días`}
                        </span>
                        {d.tipo && ` · ${d.tipo}`}
                        {d.matter_id && (
                          <>
                            {' · '}
                            <Link href={`/casos/${d.matter_id}`} className="text-accent hover:underline">
                              caso
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyHint text="Sin plazos próximos en el horizonte" />
          )}
        </Section>

        {/* Menciones */}
        <Section
          title="Te mencionaron"
          icon={<AtSign size={14} className="text-accent" />}
          link={{ href: '/menciones', label: 'Ver todas' }}
        >
          {data.mentions_unread?.length ? (
            <ul className="flex flex-col gap-1">
              {data.mentions_unread.slice(0, 6).map((m) => (
                <li key={m.id} className="flex items-start gap-2 rounded-md border border-line bg-bg-elev px-2.5 py-1.5">
                  <AtSign size={12} className="mt-0.5 flex-none text-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[12px]">{m.body_preview}</p>
                    <div className="flex items-center gap-1.5 text-[10.5px] muted">
                      <span>{formatRelative(m.created_at)}</span>
                      {m.matter_id && (
                        <>
                          <span>·</span>
                          <Link href={`/casos/${m.matter_id}?comment=${m.comment_id}`} className="text-accent hover:underline"
                            onClick={() => markRead(m.id)}>
                            ir al comentario
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text="Nada nuevo aquí" />
          )}
        </Section>

        {/* Predicciones recientes */}
        <Section
          title="Predicciones recientes"
          icon={<TrendingUp size={14} className="text-accent" />}
        >
          {data.predictions_recent?.length ? (
            <ul className="flex flex-col gap-1">
              {data.predictions_recent.slice(0, 6).map((p) => (
                <li key={`${p.matter_id}-${p.generated_at}`} className="flex items-start gap-2 rounded-md border border-line bg-bg-elev px-2.5 py-1.5">
                  <Sparkles size={12} className="mt-0.5 flex-none text-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px]">
                      <span className="font-medium">{outcomeLabel(p.primary_outcome)}</span>
                      <span className="muted"> · ganar {Math.round(p.prob_won * 100)}%</span>
                      <span className="muted"> · confianza {Math.round(p.confidence * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10.5px] muted">
                      <span>{formatRelative(p.generated_at)}</span>
                      {p.matter_id && (
                        <>
                          <span>·</span>
                          <Link href={`/casos/${p.matter_id}`} className="text-accent hover:underline">
                            ver caso
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text="Aún no hay predicciones recientes" />
          )}
        </Section>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, tone }: {
  label: string; value: number; icon: React.ReactNode; tone: 'default' | 'warn' | 'accent';
}) {
  return (
    <div className="surface flex items-center gap-3 p-3">
      <span className={cn('grid h-9 w-9 flex-none place-items-center rounded-full',
        tone === 'warn' ? 'bg-warn-soft text-warn'
        : tone === 'accent' ? 'bg-accent-soft text-accent'
        : 'bg-bg-sunken text-ink-3',
      )}>
        {icon}
      </span>
      <div>
        <div className="serif tabular text-[20px] font-semibold leading-none">{value}</div>
        <div className="mt-0.5 text-[11px] muted">{label}</div>
      </div>
    </div>
  );
}

function Section({ title, icon, link, children }: {
  title: string;
  icon?: React.ReactNode;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="surface p-[var(--pad-card)]">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="serif m-0 flex items-center gap-1.5 text-[13.5px] font-semibold">
          {icon} {title}
        </h3>
        {link && (
          <Link href={link.href} className="text-[11px] text-accent hover:underline">
            {link.label} →
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="py-4 text-center text-[11.5px] muted">{text}</div>;
}

function outcomeLabel(o: string): string {
  return o === 'won' ? 'Favorable'
    : o === 'lost' ? 'Desfavorable'
    : o === 'settled' ? 'Conciliación'
    : o === 'abandoned' ? 'Abandono'
    : 'Sin datos';
}
