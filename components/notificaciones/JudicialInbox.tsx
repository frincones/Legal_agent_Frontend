'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { formatRelative, cn } from '@/lib/utils';

export type JudicialNotif = {
  id: string;
  matter_id: string | null;
  fuente: string;
  titulo: string;
  resumen: string | null;
  url_oficial: string | null;
  fecha_publicacion: string | null;
  fecha_actuacion: string | null;
  expediente: string | null;
  juzgado: string | null;
  tipo: string | null;
  severidad: 'info' | 'alta' | 'critica';
  status: 'unread' | 'read' | 'archived' | 'snoozed';
  created_at: string;
  read_at: string | null;
};

const SEV_CHIP: Record<string, string> = {
  critica: 'chip-red',
  alta: 'chip-amber',
  info: '',
};

const SEV_LABEL: Record<string, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  info: 'Info',
};

export function JudicialInbox({ items: initial }: { items: JudicialNotif[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<'unread' | 'all'>('unread');
  const [polling, setPolling] = useState(false);
  const [, startTransition] = useTransition();

  const visible = items.filter((n) => filter === 'all' || n.status === 'unread');

  async function pollNow() {
    setPolling(true);
    try {
      const res = await fetch('/api/notifications/judicial/poll', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { polled: number; inserted: number };
      toast.success(
        `${data.inserted} nueva${data.inserted !== 1 ? 's' : ''} de ${data.polled} expediente${data.polled !== 1 ? 's' : ''}`,
      );
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setPolling(false);
    }
  }

  async function setStatus(id: string, status: 'read' | 'archived' | 'unread') {
    // optimistic
    setItems((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      const res = await fetch(`/api/notifications/judicial/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
      // rollback
      setItems(initial);
    }
  }

  return (
    <section className="surface p-[var(--pad-card)]">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="serif m-0 text-[16px] font-semibold">Novedades judiciales</h3>
        <span className="chip chip-red">
          <span className="dot" />
          {items.filter((n) => n.severidad === 'critica' && n.status === 'unread').length} críticas
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter(filter === 'unread' ? 'all' : 'unread')}
            className="btn btn-sm"
          >
            {filter === 'unread' ? 'Ver todas' : 'Sólo no leídas'}
          </button>
          <button
            type="button"
            onClick={() => void pollNow()}
            disabled={polling}
            className="btn btn-sm btn-primary"
          >
            {polling ? 'Buscando…' : <>Buscar novedades {Ic.search}</>}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col">
        {visible.length === 0 ? (
          <div className="text-[12.5px] muted">
            {filter === 'unread'
              ? 'Sin novedades sin leer. Buen trabajo.'
              : 'No hay notificaciones registradas.'}
          </div>
        ) : (
          visible.map((n) => (
            <article
              key={n.id}
              className={cn(
                'flex flex-col gap-1 border-b border-line py-3 last:border-0',
                n.status === 'unread' && 'bg-bg-sunken/40 -mx-[var(--pad-card)] px-[var(--pad-card)]',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('chip', SEV_CHIP[n.severidad])}>
                  {SEV_LABEL[n.severidad]}
                </span>
                <span className="chip text-[10.5px]">{n.tipo ?? n.fuente}</span>
                {n.fecha_publicacion && (
                  <span className="text-[11.5px] muted">
                    {n.fecha_publicacion}
                  </span>
                )}
                <span className="ml-auto text-[10.5px] muted">
                  {formatRelative(n.created_at)}
                </span>
              </div>
              <div className="text-[13.5px] font-semibold">{n.titulo}</div>
              {n.juzgado && <div className="text-[11.5px] muted">{n.juzgado}</div>}
              {n.expediente && (
                <div className="mono text-[10.5px] muted">Exp. {n.expediente}</div>
              )}
              {n.resumen && (
                <div className="line-clamp-2 text-[12px] text-ink-2">{n.resumen}</div>
              )}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {n.matter_id && (
                  <Link href={`/casos/${n.matter_id}`} className="btn btn-sm">
                    Abrir caso
                  </Link>
                )}
                {n.url_oficial && (
                  <a
                    href={n.url_oficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                  >
                    {Ic.shield} Ver fuente oficial
                  </a>
                )}
                {n.status === 'unread' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void setStatus(n.id, 'read')}
                      className="btn btn-sm btn-ghost"
                    >
                      Marcar leído
                    </button>
                    <button
                      type="button"
                      onClick={() => void setStatus(n.id, 'archived')}
                      className="btn btn-sm btn-ghost"
                    >
                      Archivar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setStatus(n.id, 'unread')}
                    className="btn btn-sm btn-ghost"
                  >
                    Marcar no leído
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
