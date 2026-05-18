'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, MessageCircle, MoreHorizontal, Reply, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';
import { MentionAwareTextarea } from './MentionAwareTextarea';
import { useDataChangeRefresh } from '@/lib/hooks/useDataChangeRefresh';

type Comment = {
  id: string;
  anchor_kind: 'matter' | 'matter_document' | 'canvas' | 'lesson' | 'kb_entry';
  matter_id: string | null;
  matter_document_id: string | null;
  parent_id: string | null;
  thread_root_id: string | null;
  body: string;
  mentions: string[];
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  edited_at: string | null;
  created_by: string | null;
  author_name: string | null;
  author_avatar: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type Anchor =
  | { kind: 'matter'; matter_id: string }
  | { kind: 'matter_document'; matter_document_id: string; matter_id?: string }
  | { kind: 'lesson'; lesson_id: string; matter_id?: string }
  | { kind: 'kb_entry'; kb_entry_id: string }
  | { kind: 'canvas'; matter_id: string };

/**
 * Sprint 16 · Hilo de comentarios anclable a:
 *   - matter completo (anchor.kind='matter')
 *   - matter_document
 *   - canvas (matter)
 *   - lesson
 *   - kb_entry
 *
 * Renderiza thread roots ordenados por created_at desc y debajo los replies
 * (un nivel de profundidad para UI simple).
 */
export function CommentsThread({
  anchor,
  emptyHint,
  className,
  currentUserId,
}: {
  anchor: Anchor;
  emptyHint?: string;
  className?: string;
  currentUserId?: string | null;
}) {
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '200', include_resolved: 'true' });
    if (anchor.kind === 'matter') params.set('matter_id', anchor.matter_id);
    if (anchor.kind === 'matter_document') params.set('matter_document_id', anchor.matter_document_id);
    if (anchor.kind === 'lesson') params.set('lesson_id', anchor.lesson_id);
    if (anchor.kind === 'kb_entry') params.set('kb_entry_id', anchor.kb_entry_id);
    if (anchor.kind === 'canvas') params.set('matter_id', anchor.matter_id);
    return params.toString();
  }, [anchor]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/comments?${query}`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Refresca thread cuando el agente agrega/resuelve comentario vía tool.
  // Filtra por matter del anchor cuando aplica para evitar refetch innecesarios.
  const matterFilter = (anchor.kind === 'matter' || anchor.kind === 'canvas')
    ? anchor.matter_id
    : (anchor.kind === 'matter_document' || anchor.kind === 'lesson')
    ? anchor.matter_id
    : undefined;
  useDataChangeRefresh('comments', refresh, { matterId: matterFilter });

  async function createRoot() {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        anchor_kind: anchor.kind,
        body: draft.trim(),
      };
      if (anchor.kind === 'matter') payload.matter_id = anchor.matter_id;
      if (anchor.kind === 'matter_document') {
        payload.matter_document_id = anchor.matter_document_id;
        if (anchor.matter_id) payload.matter_id = anchor.matter_id;
      }
      if (anchor.kind === 'lesson') {
        payload.lesson_id = anchor.lesson_id;
        if (anchor.matter_id) payload.matter_id = anchor.matter_id;
      }
      if (anchor.kind === 'kb_entry') payload.kb_entry_id = anchor.kb_entry_id;
      if (anchor.kind === 'canvas') payload.matter_id = anchor.matter_id;
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        setDraft('');
        void refresh();
      } else {
        const data = await r.json().catch(() => ({}));
        toast.error(data.detail || data.error || 'No se pudo comentar');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function reply(parentId: string) {
    if (!replyDraft.trim()) return;
    const r = await fetch(`/api/comments/${parentId}/reply`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: replyDraft.trim() }),
    });
    if (r.ok) {
      setReplyDraft('');
      setReplyTo(null);
      void refresh();
    } else {
      toast.error('No se pudo responder');
    }
  }

  async function resolve(id: string, currentlyResolved: boolean) {
    const r = await fetch(`/api/comments/${id}/${currentlyResolved ? 'unresolve' : 'resolve'}`, {
      method: 'POST',
    });
    if (r.ok) void refresh();
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar comentario?')) return;
    const r = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setItems((p) => p.filter((c) => c.id !== id && c.thread_root_id !== id));
      toast.success('Eliminado');
    }
  }

  // Agrupamos por thread_root_id
  const roots = useMemo(
    () => items.filter((c) => c.parent_id === null).sort((a, b) =>
      (b.created_at || '').localeCompare(a.created_at || '')),
    [items],
  );
  const repliesByRoot = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const c of items) {
      if (c.parent_id) {
        const root = c.thread_root_id || c.parent_id;
        if (!map.has(root)) map.set(root, []);
        map.get(root)!.push(c);
      }
    }
    map.forEach((arr) => arr.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')));
    return map;
  }, [items]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="rounded-md border border-line bg-bg-elev p-2">
        <MentionAwareTextarea
          value={draft}
          onChange={setDraft}
          placeholder="Escribe un comentario · usa @ para mencionar a alguien"
          rows={2}
          onSubmit={createRoot}
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px] muted">
          <span>Cmd/Ctrl + Enter para enviar</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={createRoot}
            disabled={!draft.trim() || submitting}
          >
            Comentar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-6 text-center text-[12px] muted">Cargando…</div>
      ) : roots.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-6 text-center">
          <MessageCircle className="mx-auto text-ink-3" size={20} />
          <div className="mt-1 text-[12.5px] muted">{emptyHint || 'Aún no hay comentarios'}</div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {roots.map((root) => (
            <li key={root.id} className={cn(
              'rounded-md border border-line bg-bg-elev p-3',
              root.resolved && 'opacity-60',
            )}>
              <CommentBody
                c={root}
                isOwner={currentUserId === root.created_by}
                onResolve={() => resolve(root.id, root.resolved)}
                onRemove={() => remove(root.id)}
                onReply={() => { setReplyTo(replyTo === root.id ? null : root.id); setReplyDraft(''); }}
              />
              {(repliesByRoot.get(root.id) || []).map((r) => (
                <div key={r.id} className="mt-2 ml-6 border-l-2 border-line pl-3">
                  <CommentBody
                    c={r}
                    isOwner={currentUserId === r.created_by}
                    onResolve={() => { /* solo raíz se resuelve */ }}
                    onRemove={() => remove(r.id)}
                    onReply={() => { setReplyTo(replyTo === root.id ? null : root.id); setReplyDraft(''); }}
                    hideResolve
                  />
                </div>
              ))}
              {replyTo === root.id && (
                <div className="mt-2 ml-6 rounded-md border border-line bg-bg p-2">
                  <MentionAwareTextarea
                    value={replyDraft}
                    onChange={setReplyDraft}
                    placeholder="Responder…"
                    rows={2}
                    onSubmit={() => reply(root.id)}
                  />
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setReplyTo(null)}>
                      <X size={12} /> Cancelar
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => reply(root.id)}
                      disabled={!replyDraft.trim()}
                    >
                      <Reply size={12} /> Responder
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentBody({
  c, isOwner, onResolve, onRemove, onReply, hideResolve,
}: {
  c: Comment;
  isOwner: boolean;
  onResolve: () => void;
  onRemove: () => void;
  onReply: () => void;
  hideResolve?: boolean;
}) {
  return (
    <article className="grid grid-cols-[28px_1fr_auto] items-start gap-2">
      <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-accent text-[11px] font-semibold text-white">
        {(c.author_name || '?').slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0">
        <header className="flex flex-wrap items-baseline gap-2">
          <span className="text-[12.5px] font-semibold">{c.author_name || 'Usuario'}</span>
          <span className="text-[10.5px] muted">{c.created_at ? formatRelative(c.created_at) : ''}</span>
          {c.edited_at && <span className="text-[10.5px] muted">· editado</span>}
          {c.resolved && (
            <span className="chip chip-green text-[10px]">
              <CheckCircle2 size={9} /> Resuelto
            </span>
          )}
        </header>
        <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] leading-relaxed">
          {renderBodyWithMentions(c.body)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {!hideResolve && (
          <button
            className="btn btn-icon btn-ghost btn-sm"
            onClick={onResolve}
            aria-label={c.resolved ? 'Reabrir' : 'Marcar como resuelto'}
            title={c.resolved ? 'Reabrir' : 'Resolver'}
          >
            <Check size={12} className={cn(c.resolved ? 'text-ok' : 'text-ink-3')} />
          </button>
        )}
        <button className="btn btn-icon btn-ghost btn-sm" onClick={onReply} aria-label="Responder">
          <Reply size={12} />
        </button>
        {isOwner && (
          <button className="btn btn-icon btn-ghost btn-sm" onClick={onRemove} aria-label="Eliminar">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </article>
  );
}

/** Resalta tokens @"..." y @handle en el body. Sin sanitizer porque es texto plano. */
function renderBodyWithMentions(body: string): React.ReactNode[] {
  const regex = /(?<=^|\s)@(?:"([^"]{1,80})"|([A-Za-zÀ-ÿ][\w.\-]{1,40}))/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(body)) !== null) {
    if (m.index > last) parts.push(body.slice(last, m.index));
    parts.push(
      <span key={`${m.index}-${m[0]}`} className="font-medium text-accent">
        @{m[1] || m[2]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < body.length) parts.push(body.slice(last));
  return parts;
}
