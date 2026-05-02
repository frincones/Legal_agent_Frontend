'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { formatRelative } from '@/lib/utils';

export type PrescripcionRow = {
  id: string;
  case_label: string | null;
  tipo_accion: string;
  fecha_exigibilidad: string;
  fecha_interrupcion: string | null;
  fecha_prescripcion: string;
  dias_restantes: number;
  prescrita: boolean;
  formulas_version: string;
  computed_at: string;
};

const TIPO_LABEL: Record<string, string> = {
  civil_ordinaria: 'Civil ordinaria',
  civil_ejecutiva: 'Civil ejecutiva',
  comercial_ordinaria: 'Comercial ordinaria',
  comercial_ejecutiva: 'Comercial ejecutiva',
  laboral: 'Laboral',
  familiar_alimentos: 'Familiar alimentos',
  accion_revision: 'Acción revisión',
  penal_querella: 'Penal querella',
};

export function PrescripcionHistorial({ rows: initial }: { rows: PrescripcionRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function saveRename(id: string) {
    const label = editValue.trim();
    if (!label) {
      toast.error('Escribe una etiqueta');
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/calc/prescripcion/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ case_label: label }),
      });
      if (!res.ok) throw new Error(await res.text());
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, case_label: label } : r)));
      setEditingId(null);
      toast.success('Etiqueta actualizada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('¿Eliminar este cálculo?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/calc/prescripcion/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setRows((rs) => rs.filter((r) => r.id !== id));
      toast.success('Eliminado');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return <div className="muted text-[12.5px]">Sin cálculos guardados.</div>;
  }

  return (
    <div className="flex flex-col">
      {rows.map((r) => {
        const isEditing = editingId === r.id;
        return (
          <div
            key={r.id}
            className="flex items-start gap-3 border-b border-line py-3 last:border-0"
          >
            <span className="grid h-[28px] w-[28px] flex-none place-items-center rounded-md bg-bg-sunken text-ink-2">
              {Ic.cal}
            </span>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    className="flex-1 rounded-md border border-line-strong bg-bg-elev px-2 py-1 text-[13px] outline-none focus:border-accent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveRename(r.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void saveRename(r.id)}
                    disabled={busyId === r.id}
                    className="btn btn-sm btn-primary"
                  >
                    Guardar
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="btn btn-sm">
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(r.id);
                    setEditValue(r.case_label ?? '');
                  }}
                  className="block w-full text-left hover:underline"
                  title="Click para renombrar"
                >
                  <div className="text-[13px] font-semibold">
                    {r.case_label ?? 'Sin etiqueta'}
                  </div>
                </button>
              )}
              <div className="text-[11.5px] muted">
                {TIPO_LABEL[r.tipo_accion] ?? r.tipo_accion} · exigible {r.fecha_exigibilidad}
                {r.fecha_interrupcion ? ` · interrumpido ${r.fecha_interrupcion}` : ''}
              </div>
              <div className={`serif tabular mt-1 text-[14px] font-semibold ${r.prescrita ? 'text-danger' : 'text-ok'}`}>
                {r.fecha_prescripcion}
                {' · '}
                {r.prescrita
                  ? `prescrita hace ${Math.abs(r.dias_restantes)}d`
                  : `${r.dias_restantes}d restantes`}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <div className="text-[10.5px] muted">{formatRelative(r.computed_at)}</div>
              <div className="mono text-[10.5px] muted">{r.formulas_version}</div>
              <button
                type="button"
                onClick={() => void remove(r.id)}
                disabled={busyId === r.id}
                aria-label="Eliminar"
                className="btn btn-icon btn-ghost btn-sm text-danger"
              >
                {Ic.x}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
