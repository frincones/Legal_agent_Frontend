'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Tipo = 'acceso' | 'rectificacion' | 'cancelacion' | 'oposicion';

const LABELS: Record<Tipo, string> = {
  acceso: 'Acceso · obtener copia de los datos personales',
  rectificacion: 'Rectificación · corregir datos inexactos o incompletos',
  cancelacion: 'Cancelación · suprimir datos cuando deje de existir base legal',
  oposicion: 'Oposición · objetar el tratamiento por motivo legítimo',
};

export function ARCORequestForm() {
  const [tipo, setTipo] = useState<Tipo>('acceso');
  const [titularNombre, setTitularNombre] = useState('');
  const [titularDoc, setTitularDoc] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titularNombre || !titularDoc) {
      toast.error('Completa los datos del titular');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/arco', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tipo, titular_nombre: titularNombre, titular_doc: titularDoc, descripcion }),
      });
      if (!res.ok) throw new Error('No se pudo registrar la solicitud');
      toast.success('Solicitud registrada · respuesta en 10 días hábiles');
      setTitularNombre('');
      setTitularDoc('');
      setDescripcion('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
      <label className="text-[12px]">
        <div className="mb-1.5 font-semibold uppercase tracking-wider muted">Tipo de solicitud</div>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as Tipo)}
          className="w-full rounded-md border border-line-strong bg-bg-elev p-[10px_12px] text-[14px]"
        >
          {(Object.keys(LABELS) as Tipo[]).map((k) => (
            <option key={k} value={k}>
              {LABELS[k]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-[12px]">
          <div className="mb-1.5 font-semibold uppercase tracking-wider muted">Nombre del titular</div>
          <input
            value={titularNombre}
            onChange={(e) => setTitularNombre(e.target.value)}
            className="w-full rounded-md border border-line-strong bg-bg-elev p-[10px_12px] text-[14px]"
            required
          />
        </label>
        <label className="text-[12px]">
          <div className="mb-1.5 font-semibold uppercase tracking-wider muted">Cédula / NIT</div>
          <input
            value={titularDoc}
            onChange={(e) => setTitularDoc(e.target.value)}
            className="w-full rounded-md border border-line-strong bg-bg-elev p-[10px_12px] text-[14px]"
            required
          />
        </label>
      </div>
      <label className="text-[12px]">
        <div className="mb-1.5 font-semibold uppercase tracking-wider muted">Descripción</div>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-line-strong bg-bg-elev p-[10px_12px] text-[14px]"
          placeholder="Detalla qué dato quieres acceder/rectificar/cancelar/oponer."
        />
      </label>
      <button type="submit" disabled={busy} className="btn btn-primary self-start">
        {busy ? 'Enviando…' : 'Registrar solicitud'}
      </button>
    </form>
  );
}
