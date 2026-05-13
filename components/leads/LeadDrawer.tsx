'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Briefcase, Check, Loader2, MessageCircle, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCOP, formatRelative } from '@/lib/utils';

type Activity = {
  id: string;
  kind: string;
  body: string | null;
  user_id: string | null;
  occurred_at: string | null;
};

type LeadDetail = {
  lead: {
    id: string;
    stage_id: string | null;
    nombre: string;
    email: string | null;
    telefono: string | null;
    source: string | null;
    materia: string | null;
    estimated_value_cop: number | null;
    notes: string | null;
    score: number;
    status: string;
    next_followup_at: string | null;
    last_contact_at: string | null;
    converted_client_id: string | null;
    converted_matter_id: string | null;
    converted_at: string | null;
    created_at: string;
  };
  activities: Activity[];
};

const KIND_LABEL: Record<string, string> = {
  note: 'Nota',
  call: 'Llamada',
  email: 'Email',
  meeting: 'Reunión',
  whatsapp: 'WhatsApp',
  stage_change: 'Cambio de etapa',
};

export function LeadDrawer({
  leadId,
  stages,
  onClose,
  onChanged,
}: {
  leadId: string;
  stages: Array<{ id: string; name: string; color: string }>;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityKind, setActivityKind] = useState('note');
  const [activityBody, setActivityBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/leads/${leadId}`, { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function logActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityBody.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: activityKind, body: activityBody }),
      });
      if (!r.ok) throw new Error(await r.text());
      setActivityBody('');
      toast.success('Actividad registrada');
      await refresh();
    } catch {
      toast.error('Error');
    } finally {
      setBusy(false);
    }
  }

  async function patchLead(patch: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error(await r.text());
      await refresh();
      onChanged();
    } catch {
      toast.error('No pude actualizar');
    } finally {
      setBusy(false);
    }
  }

  async function convert() {
    setBusy(true);
    try {
      const r = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ create_matter: true }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`Convertido · client ${d.client_id?.slice(0, 8)}…`);
      setConfirmConvert(false);
      await refresh();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function deleteLead() {
    if (!confirm('¿Eliminar este prospecto? No se puede deshacer.')) return;
    const r = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    if (r.ok) {
      toast.success('Eliminado');
      onChanged();
      onClose();
    }
  }

  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-screen w-[520px] max-w-[95vw] overflow-y-auto border-l border-line bg-bg p-5 shadow-2xl">
          {loading || !data ? (
            <div className="flex items-center gap-2 text-[12.5px] muted">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Dialog.Title className="serif text-[20px] font-semibold truncate">{data.lead.nombre}</Dialog.Title>
                  <div className="mt-1 text-[12px] muted">
                    {data.lead.source && <span>Fuente: {data.lead.source} · </span>}
                    Creado {formatRelative(data.lead.created_at)}
                  </div>
                </div>
                <button onClick={onClose} className="btn"><X size={14} aria-hidden="true" /></button>
              </div>

              {data.lead.converted_at && (
                <div className="mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-[12.5px]">
                  ✓ Convertido en cliente {data.lead.converted_at && formatRelative(data.lead.converted_at)}
                  {data.lead.converted_matter_id && ` · matter ${data.lead.converted_matter_id.slice(0, 8)}…`}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <Cell label="Email" v={data.lead.email || '—'} />
                <Cell label="Teléfono" v={data.lead.telefono || '—'} />
                <Cell label="Materia" v={data.lead.materia || '—'} />
                <Cell label="Valor estimado" v={data.lead.estimated_value_cop ? formatCOP(data.lead.estimated_value_cop) : '—'} />
                <Cell label="Score" v={`${data.lead.score}/100`} />
                <Cell label="Estado" v={data.lead.status} />
              </div>

              <section className="mt-4">
                <div className="mb-1 text-[11px] uppercase tracking-wider muted">Etapa</div>
                <div className="flex flex-wrap gap-1.5">
                  {stages.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => patchLead({})}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        fetch(`/api/leads/${leadId}/move-stage`, {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify({ stage_id: s.id }),
                        }).then(() => { void refresh(); onChanged(); });
                      }}
                      className={cn(
                        'rounded-md border px-2 py-1 text-[11.5px] font-medium',
                        data.lead.stage_id === s.id ? 'border-accent text-accent' : 'border-line text-ink-2',
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </section>

              {data.lead.notes && (
                <section className="mt-4">
                  <div className="mb-1 text-[11px] uppercase tracking-wider muted">Notas</div>
                  <div className="rounded-md border border-line bg-bg-elev p-3 text-[12.5px] whitespace-pre-wrap">{data.lead.notes}</div>
                </section>
              )}

              <section className="mt-4">
                <div className="mb-1 text-[11px] uppercase tracking-wider muted">Actividades ({data.activities.length})</div>
                <form onSubmit={logActivity} className="surface mb-2 grid gap-2 p-2">
                  <div className="flex gap-2">
                    <select value={activityKind} onChange={(e) => setActivityKind(e.target.value)} className="rounded-md border border-line bg-bg-elev px-2 py-1 text-[12px]">
                      <option value="note">Nota</option>
                      <option value="call">Llamada</option>
                      <option value="email">Email</option>
                      <option value="meeting">Reunión</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                    <input
                      value={activityBody}
                      onChange={(e) => setActivityBody(e.target.value)}
                      placeholder="Describe la interacción…"
                      className="flex-1 rounded-md border border-line bg-bg-elev px-2 py-1 text-[12px] outline-none"
                    />
                    <button type="submit" className="btn btn-primary" disabled={busy || !activityBody.trim()}>
                      Añadir
                    </button>
                  </div>
                </form>
                <ul className="grid gap-1.5">
                  {data.activities.map((a) => (
                    <li key={a.id} className="rounded-md border border-line p-2 text-[12px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{KIND_LABEL[a.kind] || a.kind}</span>
                        <span className="text-[10.5px] muted">{a.occurred_at && formatRelative(a.occurred_at)}</span>
                      </div>
                      {a.body && <div className="mt-0.5 text-[12px] muted">{a.body}</div>}
                    </li>
                  ))}
                  {data.activities.length === 0 && <li className="text-[12px] muted">Sin actividades aún.</li>}
                </ul>
              </section>

              <div className="mt-5 flex gap-2">
                {!data.lead.converted_at && (
                  <button className="btn btn-primary" onClick={() => setConfirmConvert(true)}>
                    <Briefcase size={12} aria-hidden="true" /> Convertir a cliente
                  </button>
                )}
                <button className="btn" onClick={deleteLead}>
                  <Trash2 size={12} className="text-red-500" aria-hidden="true" />
                </button>
              </div>

              {confirmConvert && (
                <div className="mt-3 surface border-accent/40 p-3 text-[12.5px]">
                  <p>Se creará un <strong>cliente</strong> y un <strong>caso</strong> nuevo a partir de este prospecto. ¿Confirmas?</p>
                  <div className="mt-2 flex gap-2">
                    <button className="btn btn-primary" onClick={convert} disabled={busy}>
                      <Check size={12} aria-hidden="true" /> Confirmar
                    </button>
                    <button className="btn" onClick={() => setConfirmConvert(false)}>Cancelar</button>
                  </div>
                </div>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Cell({ label, v }: { label: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-bg-elev p-2">
      <div className="text-[10.5px] uppercase tracking-wider muted">{label}</div>
      <div className="mt-0.5 truncate">{v}</div>
    </div>
  );
}
