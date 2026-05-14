'use client';

import { cn } from '@/lib/utils';

export type WizardField = {
  id: string;
  label: string;
  kind: 'text' | 'email' | 'phone' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox' | 'date';
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
  min?: number;
  max?: number;
};

export type WizardStep = {
  id: string;
  title: string;
  help?: string;
  fields: WizardField[];
};

/**
 * Sprint 22 · Renderer dinámico de campos de un step.
 */
export function WizardStepRenderer({
  step,
  values,
  onChange,
  className,
}: {
  step: WizardStep;
  values: Record<string, unknown>;
  onChange: (id: string, v: unknown) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <header>
        <h3 className="serif m-0 text-[18px] font-semibold -tracking-[0.01em]">{step.title}</h3>
        {step.help && <p className="mt-1 text-[12.5px] muted">{step.help}</p>}
      </header>
      {(step.fields || []).map((f) => (
        <FieldRenderer key={f.id} field={f} value={values[f.id]} onChange={(v) => onChange(f.id, v)} />
      ))}
    </div>
  );
}

function FieldRenderer({
  field, value, onChange,
}: {
  field: WizardField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const v = (value as any) ?? '';
  const required = !!field.required;
  return (
    <label className="grid gap-1">
      <span className="text-[12.5px] font-medium">
        {field.label}{required && <span className="ml-1 text-danger">*</span>}
      </span>
      {field.help && <span className="text-[11px] muted">{field.help}</span>}

      {field.kind === 'textarea' ? (
        <textarea
          className="input min-h-[120px]"
          rows={5}
          placeholder={field.placeholder}
          value={v}
          onChange={(ev) => onChange(ev.target.value)}
          required={required}
        />
      ) : field.kind === 'select' ? (
        <select
          className="input"
          value={v}
          onChange={(ev) => onChange(ev.target.value)}
          required={required}
        >
          <option value="">— Selecciona —</option>
          {(field.options || []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : field.kind === 'radio' ? (
        <div className="flex flex-col gap-1">
          {(field.options || []).map((o) => (
            <label key={o} className="flex items-center gap-2 text-[13px]">
              <input
                type="radio"
                name={field.id}
                required={required}
                value={o}
                checked={v === o}
                onChange={() => onChange(o)}
              />
              {o}
            </label>
          ))}
        </div>
      ) : field.kind === 'checkbox' ? (
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            required={required}
            checked={!!v}
            onChange={(ev) => onChange(ev.target.checked)}
          />
          <span className="muted">{field.placeholder || 'Acepto'}</span>
        </label>
      ) : field.kind === 'date' ? (
        <input
          type="date"
          className="input"
          required={required}
          value={v}
          onChange={(ev) => onChange(ev.target.value)}
        />
      ) : field.kind === 'number' ? (
        <input
          type="number"
          className="input"
          required={required}
          placeholder={field.placeholder}
          value={v}
          min={field.min}
          max={field.max}
          onChange={(ev) => onChange(ev.target.value)}
        />
      ) : (
        <input
          type={field.kind === 'email' ? 'email' : field.kind === 'phone' ? 'tel' : 'text'}
          className="input"
          required={required}
          placeholder={field.placeholder}
          value={v}
          onChange={(ev) => onChange(ev.target.value)}
        />
      )}
    </label>
  );
}
