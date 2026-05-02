'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';

type ClientOption = { id: string; nombre: string; tax_id: string | null };

const MATERIAS = [
  'laboral',
  'civil',
  'comercial',
  'penal',
  'familiar',
  'administrativo',
  'constitucional',
  'fiscal',
] as const;

export function NewMatterForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? '');
  const [titulo, setTitulo] = useState('');
  const [materia, setMateria] = useState<(typeof MATERIAS)[number]>('laboral');
  const [tribunal, setTribunal] = useState('');
  const [expediente, setExpediente] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja'>('media');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) {
      toast.error('Selecciona un cliente o crea uno primero.');
      return;
    }
    if (titulo.trim().length < 3) {
      toast.error('Escribe un título descriptivo.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/matters', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          titulo: titulo.trim(),
          materia,
          tribunal: tribunal.trim() || null,
          expediente: expediente.trim() || null,
          priority,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt.slice(0, 200) || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { id: string; display_id: string };
      toast.success(`Caso ${data.display_id} creado`);
      router.push(`/casos/${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error creando caso');
    } finally {
      setBusy(false);
    }
  }

  if (clients.length === 0) {
    return (
      <div className="surface p-6 text-center text-[13px] muted">
        No hay clientes registrados. Crea un cliente primero en{' '}
        <a href="/clientes/nuevo" className="text-accent hover:underline">/clientes/nuevo</a>.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="surface flex flex-col gap-4 p-[var(--pad-card)]">
      <Field label="Cliente">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full bg-transparent outline-none">
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
              {c.tax_id ? ` · ${c.tax_id}` : ''}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Título del caso">
        <input
          type="text"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Rodríguez vs. Comunicación Celular S.A."
          className="w-full bg-transparent outline-none"
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Materia">
          <select value={materia} onChange={(e) => setMateria(e.target.value as typeof MATERIAS[number])} className="w-full bg-transparent outline-none">
            {MATERIAS.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prioridad">
          <select value={priority} onChange={(e) => setPriority(e.target.value as 'alta' | 'media' | 'baja')} className="w-full bg-transparent outline-none">
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Tribunal / Juzgado">
          <input
            type="text"
            value={tribunal}
            onChange={(e) => setTribunal(e.target.value)}
            placeholder="Juzgado 12 Laboral del Circuito de Bogotá"
            className="w-full bg-transparent outline-none"
          />
        </Field>
        <Field label="Expediente">
          <input
            type="text"
            value={expediente}
            onChange={(e) => setExpediente(e.target.value)}
            placeholder="11001-31-05-012-2026-00473-00"
            className="w-full bg-transparent outline-none"
          />
        </Field>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn"
        >
          Cancelar
        </button>
        <button type="submit" disabled={busy} className="btn btn-primary flex-1 justify-center">
          {busy ? 'Creando…' : <>Crear caso {Ic.arrow}</>}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-wider muted">
        {label}
      </label>
      <div className="rounded-md border border-line-strong bg-bg-elev p-[10px_12px] text-[14px] focus-within:border-accent">
        {children}
      </div>
    </div>
  );
}
