'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar, CheckCircle2, Circle, Flag, Loader2, Plus, RotateCcw, Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  matter_id: string | null;
  matter_titulo: string | null;
  assignee_user_id: string | null;
  assignee_name: string | null;
  due_at: string | null;
  completed_at: string | null;
  tags: string[];
  created_at: string | null;
};

type FirmUser = { id: string; full_name: string; email: string | null };

const PRIORITY_LABELS = { low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente' } as const;
const PRIORITY_COLORS = {
  low: 'text-ink-3',
  normal: 'text-ink-2',
  high: 'text-warn',
  urgent: 'text-danger',
} as const;

export function TasksList({
  matterId,
  showMatterColumn = true,
  showAddButton = true,
  defaultAssignToCurrent = false,
}: {
  matterId?: string | null;
  showMatterColumn?: boolean;
  showAddButton?: boolean;
  defaultAssignToCurrent?: boolean;
}) {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<FirmUser[]>([]);
  const [filterStatus, setFilterStatus] = useState<'open' | 'done' | 'all'>('open');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Task>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (matterId) params.set('matter_id', matterId);
      if (filterStatus === 'open') params.set('open_only', 'true');
      else if (filterStatus === 'done') params.set('status', 'done');
      const r = await fetch(`/api/tasks?${params.toString()}`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [matterId, filterStatus]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/firm-users', { cache: 'no-store' });
        if (r.ok) {
          const data = await r.json();
          setUsers((data.items || data.users || []).map((u: any) => ({
            id: u.id, full_name: u.full_name || u.fullName || '', email: u.email || null,
          })));
        }
      } catch { /* ignore */ }
    })();
  }, []);

  async function toggle(t: Task) {
    const url = t.status === 'done'
      ? `/api/tasks/${t.id}/reopen`
      : `/api/tasks/${t.id}/complete`;
    const r = await fetch(url, { method: 'POST' });
    if (r.ok) {
      void refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar tarea?')) return;
    const r = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setItems((p) => p.filter((x) => x.id !== id));
      toast.success('Tarea eliminada');
    }
  }

  async function saveDraft() {
    if (!draft.title || !draft.title.trim()) {
      toast.error('Necesitas un título');
      return;
    }
    const payload = {
      title: draft.title.trim(),
      description: draft.description || null,
      priority: draft.priority || 'normal',
      matter_id: matterId ?? draft.matter_id ?? null,
      assignee_user_id: draft.assignee_user_id || null,
      due_at: draft.due_at || null,
      tags: draft.tags || [],
    };
    const r = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      toast.success('Tarea creada');
      setEditorOpen(false);
      setDraft({});
      void refresh();
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(data.detail || data.error || 'No se pudo crear');
    }
  }

  function openCreate() {
    setDraft({
      priority: 'normal',
      assignee_user_id: defaultAssignToCurrent ? users[0]?.id : undefined,
    });
    setEditorOpen(true);
  }

  const counts = useMemo(() => ({
    open: items.filter((t) => t.status !== 'done').length,
    done: items.filter((t) => t.status === 'done').length,
  }), [items]);

  return (
    <div className="flex flex-col gap-2">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {(['open', 'done', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={cn(
                'rounded-md px-2 py-1 text-[11.5px]',
                filterStatus === f ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-bg-sunken',
              )}
            >
              {f === 'open' ? `Pendientes${counts.open > 0 ? ` (${counts.open})` : ''}`
                : f === 'done' ? `Hechas${counts.done > 0 ? ` (${counts.done})` : ''}`
                : 'Todas'}
            </button>
          ))}
        </div>
        {showAddButton && (
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> Nueva tarea
          </button>
        )}
      </header>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={20} /></div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-8 text-center text-[12.5px] muted">
          {filterStatus === 'done' ? 'Sin tareas completadas' : 'Sin tareas pendientes'}
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((t) => (
            <li key={t.id}
              className={cn(
                'group flex items-start gap-2 rounded-md border border-line bg-bg-elev px-2.5 py-2',
                t.status === 'done' && 'opacity-60',
              )}>
              <button
                className="mt-0.5 flex-none text-ink-3 hover:text-accent"
                onClick={() => toggle(t)}
                aria-label={t.status === 'done' ? 'Reabrir' : 'Completar'}
              >
                {t.status === 'done'
                  ? <CheckCircle2 size={16} className="text-ok" />
                  : <Circle size={16} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={cn('text-[13px] font-medium', t.status === 'done' && 'line-through')}>
                  {t.title}
                </div>
                {t.description && (
                  <p className="line-clamp-2 text-[11.5px] muted">{t.description}</p>
                )}
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10.5px] muted">
                  <Flag size={9} className={PRIORITY_COLORS[t.priority]} />
                  <span className={PRIORITY_COLORS[t.priority]}>{PRIORITY_LABELS[t.priority]}</span>
                  {t.assignee_name && <span>· {t.assignee_name}</span>}
                  {t.due_at && (
                    <>
                      <span>·</span>
                      <Calendar size={9} />
                      <span className={cn(
                        new Date(t.due_at) < new Date() && t.status !== 'done' && 'text-danger',
                      )}>
                        {formatRelative(t.due_at)}
                      </span>
                    </>
                  )}
                  {showMatterColumn && t.matter_id && t.matter_titulo && (
                    <>
                      <span>·</span>
                      <Link href={`/casos/${t.matter_id}`} className="text-accent hover:underline">
                        {t.matter_titulo}
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                {t.status === 'done' && (
                  <button
                    className="btn btn-icon btn-ghost btn-sm"
                    onClick={() => toggle(t)}
                    title="Reabrir"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
                <button className="btn btn-icon btn-ghost btn-sm" onClick={() => remove(t.id)} aria-label="Eliminar">
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg-overlay backdrop-blur-sm">
          <div className="mt-[10vh] w-[min(96vw,560px)] rounded-xl border border-line bg-bg shadow-2">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h3 className="serif text-[14px] font-semibold">Nueva tarea</h3>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setEditorOpen(false)} aria-label="Cerrar">
                <X size={14} />
              </button>
            </header>
            <div className="grid gap-3 p-4">
              <input
                placeholder="¿Qué hay que hacer?"
                value={draft.title || ''}
                onChange={(ev) => setDraft((p) => ({ ...p, title: ev.target.value }))}
                className="input"
                autoFocus
              />
              <textarea
                placeholder="Descripción (opcional)"
                rows={3}
                value={draft.description || ''}
                onChange={(ev) => setDraft((p) => ({ ...p, description: ev.target.value }))}
                className="input min-h-[60px]"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="input"
                  value={draft.priority || 'normal'}
                  onChange={(ev) => setDraft((p) => ({ ...p, priority: ev.target.value as Task['priority'] }))}
                >
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
                <select
                  className="input"
                  value={draft.assignee_user_id || ''}
                  onChange={(ev) => setDraft((p) => ({ ...p, assignee_user_id: ev.target.value || null }))}
                >
                  <option value="">Sin asignar</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
              <input
                type="datetime-local"
                value={draft.due_at ? draft.due_at.slice(0, 16) : ''}
                onChange={(ev) => setDraft((p) => ({ ...p, due_at: ev.target.value ? new Date(ev.target.value).toISOString() : null }))}
                className="input"
              />
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditorOpen(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={saveDraft}>Crear</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
