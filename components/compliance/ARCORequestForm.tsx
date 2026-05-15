'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type RequestKind = 'access' | 'rectification' | 'cancellation' | 'opposition' | 'portability' | 'consent_revocation';

const LABELS: Record<RequestKind, string> = {
  access: 'Acceso · obtener copia de los datos personales',
  rectification: 'Rectificación · corregir datos inexactos o incompletos',
  cancellation: 'Cancelación · suprimir datos cuando deje de existir base legal',
  opposition: 'Oposición · objetar el tratamiento por motivo legítimo',
  portability: 'Portabilidad · obtener datos en formato estructurado',
  consent_revocation: 'Revocación del consentimiento',
};

const STATUS_CLS: Record<string, string> = {
  open: 'chip-warn', in_progress: 'chip-accent',
  requires_info: 'chip-purple', approved: 'chip-ok',
  rejected: 'chip-bad', completed: 'chip-ok', cancelled: 'chip-neutral',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta', in_progress: 'En proceso',
  requires_info: 'Requiere info', approved: 'Aprobada',
  rejected: 'Rechazada', completed: 'Completada', cancelled: 'Cancelada',
};

export function ARCORequestForm() {
  const [kind, setKind] = useState<RequestKind>('access');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dataSubjectId, setDataSubjectId] = useState('');
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  function load() {
    fetch('/api/me/arco-requests', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setRequests(d.items || []))
      .catch(() => {});
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (subject.length < 5 || description.length < 20) {
      toast.error('Completa subject (5+) y descripción (20+ caracteres)');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/me/arco-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          request_kind: kind, subject, description,
          data_subject_id: dataSubjectId || null,
        }),
      });
      if (!res.ok) throw new Error('No se pudo registrar la solicitud');
      const data = await res.json();
      toast.success(`Solicitud registrada · respuesta en máx 15 días hábiles (vence ${new Date(data.due_at).toLocaleDateString('es-CO')})`);
      setSubject(''); setDescription(''); setDataSubjectId('');
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-4">
      {requests.length > 0 && (
        <section>
          <h4 className="text-[11px] uppercase tracking-wider text-ink-3 mb-2">Mis solicitudes</h4>
          <ul className="grid gap-2">
            {requests.map((r) => (
              <li key={r.id} className="surface flex items-center gap-3 p-3 text-[12px]">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{r.subject}</div>
                  <div className="text-[10.5px] muted">
                    {LABELS[r.request_kind as RequestKind]?.split(' · ')[0] || r.request_kind} ·
                    Creada {new Date(r.created_at).toLocaleDateString('es-CO')} ·
                    Vence {new Date(r.due_at).toLocaleDateString('es-CO')}
                  </div>
                </div>
                <span className={cn('chip text-[10px]', STATUS_CLS[r.status] || 'chip-neutral')}>
                  {STATUS_LABEL[r.status] || r.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!showForm ? (
        <button className="btn btn-primary self-start" onClick={() => setShowForm(true)}>
          + Nueva solicitud ARCO
        </button>
      ) : (
        <form onSubmit={submit} className="grid gap-3 rounded-md border border-line p-4">
          <label className="text-[12px]">
            <div className="mb-1.5 font-semibold uppercase tracking-wider muted">Tipo</div>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as RequestKind)}
              className="input w-full"
            >
              {(Object.keys(LABELS) as RequestKind[]).map((k) => (
                <option key={k} value={k}>{LABELS[k]}</option>
              ))}
            </select>
          </label>
          <label className="text-[12px]">
            <div className="mb-1.5 font-semibold uppercase tracking-wider muted">Subject (resumen breve)</div>
            <input
              value={subject} onChange={(e) => setSubject(e.target.value)}
              className="input w-full" required
              placeholder="Ej. Quiero acceder a los datos del cliente X"
            />
          </label>
          <label className="text-[12px]">
            <div className="mb-1.5 font-semibold uppercase tracking-wider muted">Cédula/NIT del titular (opcional)</div>
            <input
              value={dataSubjectId} onChange={(e) => setDataSubjectId(e.target.value)}
              className="input w-full"
              placeholder="Solo si distinto a ti"
            />
          </label>
          <label className="text-[12px]">
            <div className="mb-1.5 font-semibold uppercase tracking-wider muted">Descripción detallada</div>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={5} className="input w-full"
              placeholder="Explica con detalle qué información buscas / rectificar / cancelar / opositar (mín 20 caracteres)."
              required
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy && <Loader2 size={12} className="animate-spin" />}
              {busy ? 'Enviando…' : 'Registrar solicitud'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
          <p className="text-[10.5px] muted">
            Respondemos en máx <strong>15 días hábiles</strong> según Ley 1581/2012 Art. 14.
          </p>
        </form>
      )}
    </div>
  );
}
