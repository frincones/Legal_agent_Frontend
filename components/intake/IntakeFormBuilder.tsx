'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IntakeField = {
  id: string;
  label: string;
  kind: 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox' | 'date';
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
  max_length?: number;
  min?: number;
  max?: number;
};

const KIND_LABELS: Record<IntakeField['kind'], string> = {
  text: 'Texto corto',
  email: 'Email',
  phone: 'Teléfono',
  textarea: 'Texto largo',
  number: 'Número',
  select: 'Lista desplegable',
  radio: 'Opción única',
  checkbox: 'Casilla',
  date: 'Fecha',
};

function slugifyId(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || `field_${Date.now()}`;
}

/**
 * Sprint 19 · Visual builder de campos para intake forms.
 *
 * Modifica `fields` (controlled) via `onChange`. Permite añadir, remover,
 * reordenar (↑/↓) y configurar cada campo.
 */
export function IntakeFormBuilder({
  fields,
  onChange,
}: {
  fields: IntakeField[];
  onChange: (next: IntakeField[]) => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function addField(kind: IntakeField['kind'] = 'text') {
    const next: IntakeField = {
      id: slugifyId(`Campo ${fields.length + 1}`),
      label: `Campo ${fields.length + 1}`,
      kind,
      required: false,
      options: kind === 'select' || kind === 'radio' ? ['Opción 1', 'Opción 2'] : undefined,
    };
    onChange([...fields, next]);
    setExpandedIdx(fields.length);
  }

  function updateField(idx: number, patch: Partial<IntakeField>) {
    const current = fields[idx];
    if (!current) return;
    const merged: IntakeField = { ...current, ...patch } as IntakeField;
    // Auto-slugify id si label cambia y id estaba derivado del label original
    if (patch.label !== undefined && (!merged.id || merged.id === slugifyId(current.label || ''))) {
      merged.id = slugifyId(patch.label || '');
    }
    const next = fields.slice();
    next[idx] = merged;
    onChange(next);
  }

  function removeField(idx: number) {
    onChange(fields.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
  }

  function moveField(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const next = fields.slice();
    const [removed] = next.splice(idx, 1);
    if (removed) next.splice(target, 0, removed);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {fields.length === 0 && (
        <div className="rounded-md border border-dashed border-line p-6 text-center text-[12.5px] muted">
          Tu formulario está vacío. Agrega tu primer campo para empezar.
        </div>
      )}

      {fields.map((f, i) => {
        const open = expandedIdx === i;
        return (
          <div key={i} className="rounded-md border border-line bg-bg-elev">
            <header className="flex items-center gap-2 px-2 py-1.5">
              <span className="text-ink-3"><GripVertical size={14} /></span>
              <button
                onClick={() => setExpandedIdx(open ? null : i)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="text-[12.5px] font-medium">{f.label}</div>
                <div className="text-[10.5px] muted">
                  {KIND_LABELS[f.kind]} · id: {f.id}
                  {f.required && ' · obligatorio'}
                </div>
              </button>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => moveField(i, -1)} disabled={i === 0} aria-label="Subir">
                <ChevronUp size={12} />
              </button>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} aria-label="Bajar">
                <ChevronDown size={12} />
              </button>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => removeField(i)} aria-label="Eliminar">
                <Trash2 size={12} />
              </button>
            </header>

            {open && (
              <div className="grid gap-2 border-t border-line bg-bg p-3 text-[12.5px]">
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Etiqueta</span>
                    <input
                      className="input"
                      value={f.label}
                      onChange={(ev) => updateField(i, { label: ev.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Tipo</span>
                    <select
                      className="input"
                      value={f.kind}
                      onChange={(ev) => updateField(i, { kind: ev.target.value as IntakeField['kind'] })}
                    >
                      {(Object.keys(KIND_LABELS) as IntakeField['kind'][]).map((k) => (
                        <option key={k} value={k}>{KIND_LABELS[k]}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">ID interno · no cambies si ya tienes submissions</span>
                  <input
                    className="input mono"
                    value={f.id}
                    onChange={(ev) => updateField(i, { id: ev.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Placeholder (opcional)</span>
                  <input
                    className="input"
                    value={f.placeholder || ''}
                    onChange={(ev) => updateField(i, { placeholder: ev.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Ayuda (opcional)</span>
                  <input
                    className="input"
                    value={f.help || ''}
                    onChange={(ev) => updateField(i, { help: ev.target.value })}
                  />
                </label>
                {(f.kind === 'select' || f.kind === 'radio') && (
                  <label className="flex flex-col gap-1">
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Opciones (una por línea)</span>
                    <textarea
                      className="input min-h-[80px]"
                      rows={4}
                      value={(f.options || []).join('\n')}
                      onChange={(ev) => updateField(i, { options: ev.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                    />
                  </label>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!f.required}
                    onChange={(ev) => updateField(i, { required: ev.target.checked })}
                  />
                  Obligatorio
                </label>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10.5px] uppercase tracking-wider text-ink-3 mr-1">Agregar campo:</span>
        {(['text', 'email', 'phone', 'textarea', 'number', 'select', 'checkbox', 'date'] as IntakeField['kind'][]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => addField(k)}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-bg-elev px-2 py-1 text-[11.5px] hover:bg-bg-sunken"
          >
            <Plus size={10} /> {KIND_LABELS[k]}
          </button>
        ))}
      </div>
    </div>
  );
}
