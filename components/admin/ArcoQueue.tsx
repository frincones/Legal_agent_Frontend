'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Req = {
  id: string; firm_id: string | null; firm_name: string | null;
  request_kind: string; status: string; priority: string;
  requestor_email: string; requestor_name: string | null;
  subject: string; description: string;
  due_at: string; created_at: string;
  overdue: boolean; days_to_due: number;
  assigned_email: string | null;
  response_text: string | null;
  source_law: string;
};

const STATUS_CLS: Record<string, string> = {
  open: 'chip-warn', in_progress: 'chip-accent',
  requires_info: 'chip-purple', approved: 'chip-ok',
  rejected: 'chip-bad', completed: 'chip-ok', cancelled: 'chip-neutral',
};

const KIND_LABEL: Record<string, string> = {
  access: 'Acceso', rectification: 'Rectificación',
  cancellation: 'Cancelación', opposition: 'Oposición',
  portability: 'Portabilidad', consent_revocation: 'Revoc. consentimiento',
};

export function ArcoQueue() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [selected, setSelected] = useState<Req | null>(null);
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status_filter', statusFilter);
    params.set('limit', '100');
    fetch(`/api/admin/arco-requests?${params}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [statusFilter]);

  async function changeStatus(id: string, status: string, responseText?: string) {
    const r = await fetch(`/api/admin/arco-requests/${id}/status`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, response_text: responseText || null }),
    });
    if (r.ok) { toast.success(`Status → ${status}`); load(); setSelected(null); }
    else toast.error('No se pudo cambiar status');
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    const r = await fetch(`/api/admin/arco-requests/${selected.id}/messages`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: reply, internal_note: internal }),
    });
    if (r.ok) { toast.success('Mensaje enviado'); setReply(''); setInternal(false); load(); }
    else toast.error('No se pudo enviar');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="surface flex items-center gap-3 p-3">
        <select className="input w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todas</option>
          <option value="open">Abierta</option>
          <option value="in_progress">En proceso</option>
          <option value="requires_info">Req. info</option>
          <option value="approved">Aprobada</option>
          <option value="completed">Completada</option>
          <option value="rejected">Rechazada</option>
        </select>
        <div className="text-[12px] muted">
          Total: {items.length} · Overdue: {items.filter((i) => i.overdue).length}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_380px]">
        <div className="surface overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-[13px] muted"><Loader2 size={14} className="animate-spin" /> Cargando…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-[13px] muted">Sin solicitudes en este estado.</div>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
                <tr>
                  <th className="px-3 py-2 text-left">Subject</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Solicitante</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Vence</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}
                      className={cn('cursor-pointer border-t border-line/40 hover:bg-bg-sunken/40',
                        selected?.id === r.id && 'bg-accent-soft/40',
                        r.overdue && 'border-l-2 border-l-bad')}
                      onClick={() => setSelected(r)}>
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.subject}</div>
                      <div className="text-[10.5px] muted">{r.firm_name || 'Externa'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="chip chip-neutral text-[10px]">{KIND_LABEL[r.request_kind] || r.request_kind}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[10.5px]">{r.requestor_email}</td>
                    <td className="px-3 py-2">
                      <span className={cn('chip text-[10px]', STATUS_CLS[r.status] || 'chip-neutral')}>{r.status}</span>
                    </td>
                    <td className="px-3 py-2 text-[11px]">
                      {r.overdue ? (
                        <span className="text-bad flex items-center gap-1"><AlertTriangle size={11} /> Vencida</span>
                      ) : (
                        <span className="muted">{Math.max(0, Math.round(r.days_to_due))}d</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected ? (
          <aside className="surface flex flex-col p-4">
            <header className="border-b border-line pb-3 mb-3">
              <h3 className="serif text-[15px] font-semibold leading-tight">{selected.subject}</h3>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] muted">
                <span>{KIND_LABEL[selected.request_kind]}</span>
                <span>·</span>
                <span>{selected.source_law}</span>
              </div>
              <div className="mt-2 text-[11.5px]">
                <strong>Solicitante:</strong> {selected.requestor_name || '—'}<br />
                <strong>Email:</strong> <span className="mono">{selected.requestor_email}</span><br />
                {selected.firm_name && <><strong>Firma:</strong> {selected.firm_name}<br /></>}
                <strong>Vence:</strong> {new Date(selected.due_at).toLocaleDateString('es-CO')}
                {selected.overdue && <span className="text-bad ml-2">(VENCIDA)</span>}
              </div>
            </header>

            <section className="flex-1 overflow-y-auto">
              <h4 className="text-[11px] uppercase tracking-wider text-ink-3 mb-2">Descripción</h4>
              <p className="text-[12px] whitespace-pre-wrap mb-3">{selected.description}</p>
              {selected.response_text && (
                <>
                  <h4 className="text-[11px] uppercase tracking-wider text-ink-3 mb-2">Respuesta</h4>
                  <p className="text-[12px] whitespace-pre-wrap mb-3 muted italic">{selected.response_text}</p>
                </>
              )}
            </section>

            <footer className="border-t border-line pt-3 grid gap-2">
              <textarea
                className="input min-h-20"
                placeholder="Respuesta o nota interna…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <label className="flex items-center gap-2 text-[11px]">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                Nota interna (no visible al solicitante)
              </label>
              <button className="btn btn-primary btn-sm" onClick={sendReply} disabled={!reply.trim()}>
                Enviar respuesta
              </button>
              <div className="grid grid-cols-3 gap-1">
                <button className="btn btn-sm" onClick={() => changeStatus(selected.id, 'in_progress')}>En proceso</button>
                <button className="btn btn-sm" onClick={() => changeStatus(selected.id, 'requires_info')}>Req. info</button>
                <button className="btn btn-sm" onClick={() => {
                  const resp = prompt('Texto de respuesta final:');
                  if (resp) changeStatus(selected.id, 'completed', resp);
                }}>Completar</button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                if (confirm('¿Rechazar solicitud?')) {
                  const reason = prompt('Razón del rechazo:');
                  if (reason) changeStatus(selected.id, 'rejected', reason);
                }
              }}>Rechazar</button>
            </footer>
          </aside>
        ) : (
          <aside className="surface p-6 text-center text-[12.5px] muted">
            Selecciona una solicitud para responder.
          </aside>
        )}
      </div>
    </div>
  );
}
