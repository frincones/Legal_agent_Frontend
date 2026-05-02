'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { formatCOP, formatRelative } from '@/lib/utils';

export type LiquidacionRow = {
  id: string;
  trabajador_nombre: string | null;
  fecha_ingreso: string;
  fecha_terminacion: string;
  causa: string;
  total_amount: number;
  total_currency: string;
  formulas_version: string;
  computed_at: string;
};

const CAUSA_LABEL: Record<string, string> = {
  injustificado: 'Despido sin justa causa',
  justa_causa: 'Despido con justa causa',
  renuncia: 'Renuncia voluntaria',
  mutuo_acuerdo: 'Mutuo acuerdo',
  terminacion_contrato: 'Terminación de contrato',
  fin_obra: 'Fin de obra/labor',
};

export function HistorialList({ rows: initial }: { rows: LiquidacionRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const startEdit = (r: LiquidacionRow) => {
    setEditingId(r.id);
    setEditValue(r.trabajador_nombre ?? '');
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  async function saveRename(id: string) {
    const name = editValue.trim();
    if (name.length === 0) {
      toast.error('Escribe un nombre');
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/calc/liquidacion/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ trabajador_nombre: name }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt.slice(0, 160));
      }
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, trabajador_nombre: name } : r)));
      cancelEdit();
      toast.success('Nombre actualizado');
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
      const res = await fetch(`/api/calc/liquidacion/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setRows((rs) => rs.filter((r) => r.id !== id));
      toast.success('Cálculo eliminado');
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
              {Ic.scales}
            </span>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder="Nombre del trabajador"
                    autoFocus
                    className="flex-1 rounded-md border border-line-strong bg-bg-elev px-2 py-1 text-[13px] outline-none focus:border-accent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveRename(r.id);
                      if (e.key === 'Escape') cancelEdit();
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
                  <button type="button" onClick={cancelEdit} className="btn btn-sm">
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  className="block w-full text-left hover:underline"
                  title="Click para renombrar"
                >
                  <div className="text-[13px] font-semibold">
                    {r.trabajador_nombre ?? 'Sin nombre'}
                  </div>
                </button>
              )}
              <div className="text-[11.5px] muted">
                {CAUSA_LABEL[r.causa] ?? r.causa} · {r.fecha_ingreso} → {r.fecha_terminacion}
              </div>
              <div className="serif tabular mt-1 text-[15px] font-semibold text-ok">
                {formatCOP(Number(r.total_amount))}
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
                title="Eliminar"
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
