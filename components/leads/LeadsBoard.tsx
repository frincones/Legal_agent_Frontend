'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Briefcase, Loader2, Phone, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { LeadDrawer } from './LeadDrawer';
import { cn, formatCOP, formatRelative } from '@/lib/utils';
import { useDataChangeRefresh } from '@/lib/hooks/useDataChangeRefresh';

type Lead = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  source: string | null;
  materia: string | null;
  estimated_value_cop: number | null;
  notes: string | null;
  score: number;
  status: 'open' | 'won' | 'lost' | 'dormant';
  next_followup_at: string | null;
  created_at: string;
};

type Stage = {
  id: string;
  name: string;
  sort_order: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  leads: Lead[];
  count: number;
  value_cop: number;
};

const COLOR_BG: Record<string, string> = {
  blue: 'bg-blue-500/10 border-blue-500/30',
  green: 'bg-emerald-500/10 border-emerald-500/30',
  amber: 'bg-amber-500/10 border-amber-500/30',
  red: 'bg-red-500/10 border-red-500/30',
  purple: 'bg-purple-500/10 border-purple-500/30',
  gray: 'bg-bg-sunken border-line',
};

export function LeadsBoard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [draggingLead, setDraggingLead] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/leads/kanban', { cache: 'no-store' });
      if (r.ok) setStages((await r.json()).stages || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // Refresca board cuando el agente captura un lead nuevo vía tool.
  useDataChangeRefresh('leads', refresh);

  async function moveLead(leadId: string, stageId: string) {
    try {
      const r = await fetch(`/api/leads/${leadId}/move-stage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ stage_id: stageId }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success('Etapa actualizada');
      void refresh();
    } catch {
      toast.error('No pude mover el lead');
    }
  }

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-4 text-[12.5px] muted">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando pipeline…
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="serif text-[18px] font-semibold">Pipeline de prospectos</h2>
          <p className="text-[12px] muted">Arrastra entre columnas para cambiar la etapa.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpenCreate(true)}>
          <Plus size={14} aria-hidden="true" /> Nuevo prospecto
        </button>
      </header>

      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-min pb-3">
          {stages.map((s) => (
            <div
              key={s.id}
              className={cn('flex w-[280px] flex-none flex-col rounded-md border p-2', COLOR_BG[s.color] || COLOR_BG.gray)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/lead-id') || draggingLead;
                setDraggingLead(null);
                if (id) void moveLead(id, s.id);
              }}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="text-[12.5px] font-semibold">{s.name}</div>
                <div className="text-[11px] muted">{s.count} · {formatCOP(s.value_cop)}</div>
              </div>
              <div className="flex flex-col gap-2 min-h-[60px]">
                {s.leads.map((l) => (
                  <article
                    key={l.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/lead-id', l.id);
                      setDraggingLead(l.id);
                    }}
                    onClick={() => setOpenLead(l.id)}
                    className="cursor-grab rounded-md border border-line bg-bg p-2.5 text-[12px] hover:border-accent active:cursor-grabbing"
                  >
                    <div className="font-semibold truncate">{l.nombre}</div>
                    {l.materia && <div className="text-[11px] muted truncate">{l.materia}</div>}
                    <div className="mt-1 flex items-center gap-2 text-[11px] muted">
                      {l.telefono && <span className="inline-flex items-center gap-1"><Phone size={10} aria-hidden="true" />{l.telefono}</span>}
                      {l.estimated_value_cop && <span className="font-semibold text-emerald-500">{formatCOP(l.estimated_value_cop)}</span>}
                    </div>
                    {l.next_followup_at && (
                      <div className={cn(
                        'mt-1 text-[10.5px]',
                        new Date(l.next_followup_at) < new Date() ? 'text-red-500 font-semibold' : 'muted',
                      )}>
                        Follow-up: {formatRelative(l.next_followup_at)}
                      </div>
                    )}
                  </article>
                ))}
                {s.leads.length === 0 && (
                  <div className="rounded border border-dashed border-line p-2 text-center text-[10.5px] muted">
                    Vacío
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {openLead && (
        <LeadDrawer
          leadId={openLead}
          stages={stages}
          onClose={() => setOpenLead(null)}
          onChanged={refresh}
        />
      )}

      <CreateDialog open={openCreate} onOpenChange={setOpenCreate} stages={stages} onCreated={refresh} />
    </div>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  stages,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  stages: Stage[];
  onCreated: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [source, setSource] = useState('whatsapp');
  const [materia, setMateria] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<number | ''>('');
  const [stageId, setStageId] = useState(stages[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && stages[0]?.id) setStageId(stages[0].id);
  }, [open, stages]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nombre, email: email || null, telefono: telefono || null,
          source, materia: materia || null,
          estimated_value_cop: estimatedValue || null,
          stage_id: stageId, notes: notes || null,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast.success('Prospecto creado');
      onCreated();
      onOpenChange(false);
      setNombre(''); setEmail(''); setTelefono(''); setMateria(''); setEstimatedValue(''); setNotes('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[92vw] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Nuevo prospecto</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Nombre">
              <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent outline-none" /></Field>
              <Field label="Teléfono"><input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+57 300..." className="w-full bg-transparent outline-none" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Fuente">
                <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-transparent outline-none">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="web">Web</option>
                  <option value="referido">Referido</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="otro">Otro</option>
                </select>
              </Field>
              <Field label="Materia">
                <input value={materia} onChange={(e) => setMateria(e.target.value)} placeholder="laboral, civil…" className="w-full bg-transparent outline-none" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Valor estimado (COP)">
                <input type="number" min={0} step={100000} value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full bg-transparent outline-none" />
              </Field>
              <Field label="Etapa">
                <select value={stageId} onChange={(e) => setStageId(e.target.value)} className="w-full bg-transparent outline-none">
                  {stages.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </Field>
            </div>
            <Field label="Notas">
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Sparkles size={12} aria-hidden="true" />}
                Crear
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wider muted">{label}</label>
      <div className="rounded-md border border-line bg-bg-elev p-[8px_10px] text-[13px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
