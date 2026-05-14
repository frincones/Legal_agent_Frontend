'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'] as const;

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch(`/api/admin/support/tickets/${ticketId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [ticketId]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: reply, internal_note: internal }),
      });
      if (r.ok) { toast.success('Mensaje enviado'); setReply(''); setInternal(false); load(); }
      else toast.error('No se pudo enviar');
    } finally { setSubmitting(false); }
  }

  async function changeStatus(newStatus: string) {
    const r = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (r.ok) { toast.success(`Status → ${newStatus}`); load(); }
    else toast.error('No se pudo actualizar');
  }

  if (loading) return <div className="surface flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>;
  if (!data) return <div className="surface p-6 text-center text-[13px] muted">Ticket no encontrado</div>;

  const t = data.ticket;
  const msgs = data.messages || [];

  return (
    <div className="flex flex-col gap-4">
      <header className="surface flex flex-wrap items-start justify-between gap-3 p-4">
        <div>
          <h1 className="serif text-[22px] font-semibold leading-tight">{t.subject}</h1>
          <div className="mt-1 text-[11.5px] muted">
            Firm: {t.firm_name || '—'} · Reporter: <span className="font-mono">{t.reporter_email}</span> · Categoría: {t.category}
          </div>
        </div>
        <select className="input w-40" value={t.status} onChange={(e) => changeStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </header>

      <section className="surface p-4 whitespace-pre-wrap text-[13px]">
        <header className="mb-2 flex items-center gap-2 text-[11px] muted">
          <MessageSquare size={12} /> Mensaje original · {new Date(t.created_at).toLocaleString('es-CO')}
        </header>
        {t.body}
      </section>

      {msgs.map((m: any) => (
        <section key={m.id} className={cn(
          'surface p-3 whitespace-pre-wrap text-[12.5px]',
          m.author_kind === 'admin' && 'ml-12 border-accent/40',
          m.internal_note && 'bg-warn-soft border-warn/40',
        )}>
          <header className="mb-1 flex items-center gap-2 text-[10.5px] muted">
            {m.author_kind === 'admin' ? (
              <>Admin · {m.admin_email} {m.internal_note && <span className="chip chip-warn text-[9px]">nota interna</span>}</>
            ) : (
              <>Reporter · {m.user_name || 'cliente'}</>
            )}
            <span>· {new Date(m.created_at).toLocaleString('es-CO')}</span>
          </header>
          {m.body}
        </section>
      ))}

      <section className="surface p-3">
        <textarea
          className="input min-h-24"
          placeholder="Tu respuesta…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <div className="mt-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11.5px]">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
            Nota interna (no visible al reporter)
          </label>
          <button
            className="btn btn-primary btn-sm"
            disabled={submitting || !reply.trim()}
            onClick={sendReply}
          >
            {submitting && <Loader2 size={11} className="animate-spin" />}
            <Send size={12} /> Enviar
          </button>
        </div>
      </section>
    </div>
  );
}
