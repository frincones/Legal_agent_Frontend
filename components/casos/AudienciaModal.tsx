'use client';

/**
 * Sprint B · AudienciaModal
 *
 * Modal para crear una audiencia/reunión desde el caso.
 * Push directo a Google Calendar / Outlook del usuario via /api/calendar/events.
 *
 * Inputs:
 *   - matterId
 *   - clientEmail (opcional · pre-llena attendees)
 *   - matterTitulo (opcional · pre-llena title)
 *
 * Output: POST /api/calendar/events → toast + close + onCreated callback
 */

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CalendarPlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

type Kind = 'audiencia' | 'conciliacion' | 'reunion' | 'plazo' | 'otro';

const KIND_LABELS: Record<Kind, string> = {
  audiencia: 'Audiencia',
  conciliacion: 'Conciliación',
  reunion: 'Reunión',
  plazo: 'Plazo procesal',
  otro: 'Otro',
};

export function AudienciaModal({
  matterId,
  matterTitulo,
  clientEmail,
  open,
  onOpenChange,
  onCreated,
}: {
  matterId: string;
  matterTitulo?: string;
  clientEmail?: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (event: { id: string; meeting_url?: string | null }) => void;
}) {
  const [kind, setKind] = useState<Kind>('audiencia');
  const [title, setTitle] = useState<string>(matterTitulo ? `Audiencia · ${matterTitulo}` : '');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateStr, setDateStr] = useState(() => defaultDateStr());
  const [timeStr, setTimeStr] = useState('09:00');
  const [durationMin, setDurationMin] = useState(60);
  const [attendees, setAttendees] = useState(clientEmail || '');
  const [createConference, setCreateConference] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Indica un título');
      return;
    }
    const start = new Date(`${dateStr}T${timeStr}:00`);
    if (isNaN(start.getTime())) {
      toast.error('Fecha/hora inválida');
      return;
    }
    const end = new Date(start.getTime() + durationMin * 60 * 1000);

    const attendeesList = attendees
      .split(/[,;\s]+/)
      .map(s => s.trim())
      .filter(s => /.+@.+\..+/.test(s));

    setSubmitting(true);
    try {
      const r = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matter_id: matterId,
          kind,
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          attendees: attendeesList,
          create_conference: createConference,
          timezone: 'America/Bogota',
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const message = body?.detail?.message || body?.detail || `Error ${r.status}`;
        toast.error(typeof message === 'string' ? message : 'No pude crear la audiencia');
        return;
      }
      const data = await r.json();
      toast.success(
        data.meeting_url
          ? `Audiencia creada con link ${data.provider === 'outlook' ? 'Teams' : 'Meet'}`
          : 'Audiencia creada en tu calendario'
      );
      onCreated?.(data);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 surface p-6 max-h-[90vh] overflow-auto">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <Dialog.Title className="serif text-[18px] font-semibold">
                Nueva audiencia
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[12.5px] muted">
                Se creará en tu calendario conectado y se vinculará al caso.
              </Dialog.Description>
            </div>
            <Dialog.Close className="btn btn-sm">
              <X size={14} />
            </Dialog.Close>
          </div>

          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <label className="text-[12px] font-medium">Tipo</label>
              <select
                value={kind}
                onChange={e => setKind(e.target.value as Kind)}
                className="input mt-1 w-full"
              >
                {(Object.keys(KIND_LABELS) as Kind[]).map(k => (
                  <option key={k} value={k}>{KIND_LABELS[k]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-medium">Título *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Audiencia conciliación · Tutela #4521"
                className="input mt-1 w-full"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[12px] font-medium">Fecha *</label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={e => setDateStr(e.target.value)}
                  className="input mt-1 w-full"
                  required
                />
              </div>
              <div>
                <label className="text-[12px] font-medium">Hora *</label>
                <input
                  type="time"
                  value={timeStr}
                  onChange={e => setTimeStr(e.target.value)}
                  className="input mt-1 w-full"
                  required
                />
              </div>
              <div>
                <label className="text-[12px] font-medium">Duración (min)</label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={durationMin}
                  onChange={e => setDurationMin(Number(e.target.value) || 60)}
                  className="input mt-1 w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium">Ubicación / Juzgado</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Juzgado 12 Civil · Sala 3 (o vacío si virtual)"
                className="input mt-1 w-full"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium">
                Asistentes (emails, separados por coma)
              </label>
              <input
                value={attendees}
                onChange={e => setAttendees(e.target.value)}
                placeholder="cliente@gmail.com, juzgado@..."
                className="input mt-1 w-full"
              />
              <p className="mt-1 text-[11px] muted">
                Recibirán invitación por email automáticamente.
              </p>
            </div>

            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={createConference}
                onChange={e => setCreateConference(e.target.checked)}
              />
              <span>Crear link de videoconferencia (Meet/Teams)</span>
            </label>

            <div>
              <label className="text-[12px] font-medium">Descripción / Notas</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="input mt-1 w-full resize-none"
                placeholder="Detalles internos del caso o agenda…"
              />
            </div>

            <div className="mt-2 flex gap-2">
              <Dialog.Close className="btn flex-1" type="button">
                Cancelar
              </Dialog.Close>
              <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Creando…</>
                ) : (
                  <><CalendarPlus size={14} /> Crear audiencia</>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function defaultDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
