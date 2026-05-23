'use client';

/**
 * components/v2/document-gen/InlineParamsForm.tsx
 *
 * Form embebido en la burbuja del asistente para clarificar parametros
 * antes de generar un documento. Max 5 campos visibles para no abrumar.
 *
 * Se renderiza cuando el agente necesita info que no pudo extraer del brief
 * inicial. Tiene 2 botones:
 *   - [Omitir] genera con placeholders [CAMPO_X] visibles
 *   - [Continuar] dispara generacion con datos
 *
 * Diseno minimalista tipo Apple coherente con tokens v2.
 */

import { useState, type FormEvent } from 'react';

export interface ParamField {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'date';
  required?: boolean;
}

export interface InlineParamsFormProps {
  /** Tipo de documento (para titulo contextual). */
  docType: string;
  /** Hasta 5 campos visibles. Si necesitas mas, agrupar en steps. */
  fields: ParamField[];
  /** Submit con datos. */
  onSubmit: (values: Record<string, string>) => void;
  /** Omitir y generar con placeholders. */
  onSkip: () => void;
  /** Cancelar y volver al chat. */
  onCancel?: () => void;
}

export function InlineParamsForm({ docType, fields, onSubmit, onSkip, onCancel }: InlineParamsFormProps) {
  const visibleFields = fields.slice(0, 5);
  const [values, setValues] = useState<Record<string, string>>(() =>
    visibleFields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {}),
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-white p-4"
      style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
    >
      <div className="mb-3">
        <h3
          className="text-[14px] font-medium"
          style={{ color: 'var(--v2-text-primary, #1A1916)' }}
        >
          Datos para el {docType}
        </h3>
        <p className="mt-1 text-[12px]" style={{ color: 'var(--v2-text-tertiary, #807E76)' }}>
          Confirma estos datos o pulsa &quot;Omitir&quot; para generar con datos demo editables.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {visibleFields.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={`param-${field.key}`}
              className="block text-[12px] font-medium"
              style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
            >
              {field.label}
              {field.required && <span className="ml-1 text-[var(--v2-accent-copper,#B8763C)]">*</span>}
            </label>
            <input
              id={`param-${field.key}`}
              type={field.type ?? 'text'}
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              required={field.required}
              className="mt-1 w-full rounded-md border bg-white px-3 py-1.5 text-[13px] outline-none transition-colors focus:border-[var(--v2-brand-navy,#0E2A5E)] focus:ring-2 focus:ring-[var(--v2-brand-navy,#0E2A5E)]/20"
              style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
            style={{ color: 'var(--v2-text-tertiary, #807E76)' }}
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
          style={{
            borderColor: 'var(--v2-border-default, #D4D2CA)',
            color: 'var(--v2-text-secondary, #4A4944)',
          }}
        >
          Omitir — generar con demo
        </button>
        <button
          type="submit"
          className="rounded-md px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--v2-brand-navy, #0E2A5E)' }}
        >
          Continuar con estos datos
        </button>
      </div>
    </form>
  );
}
