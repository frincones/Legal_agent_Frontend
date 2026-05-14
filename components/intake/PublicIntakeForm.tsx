'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Field = {
  id: string;
  label: string;
  kind: string;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
};

type FormDef = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  fields: Field[];
  thank_you_message: string | null;
  redirect_url: string | null;
  brand_color: string | null;
  show_firm_logo: boolean;
  firm_name: string | null;
};

export function PublicIntakeForm({ form }: { form: FormDef }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ message: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function setVal(id: string, v: unknown) {
    setValues((p) => ({ ...p, [id]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrors([]);
    try {
      const res = await fetch(`/api/public/intake/${encodeURIComponent(form.slug)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
          return;
        }
        setDone({ message: data.thank_you_message || form.thank_you_message || 'Gracias.' });
      } else {
        const errs = data?.detail?.errors || (typeof data?.detail === 'string' ? [data.detail] : ['Error al enviar']);
        setErrors(Array.isArray(errs) ? errs : [String(errs)]);
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Error de red']);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[640px] flex-col items-center justify-center px-6 py-12 text-center">
        <CheckCircle2 size={48} className="text-ok" />
        <h1 className="serif mt-4 text-[28px] font-semibold">{done.message}</h1>
        <p className="mt-2 text-[14px] muted">Hemos recibido tu información. Te contactaremos pronto.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-6 py-12">
      {form.show_firm_logo && form.firm_name && (
        <div className="mb-6 text-center">
          <div className="serif text-[14px] muted">{form.firm_name}</div>
        </div>
      )}
      <header className="mb-6">
        <h1 className="serif text-[28px] font-semibold -tracking-[0.02em]">{form.name}</h1>
        {form.description && (
          <p className="mt-2 text-[14px] muted">{form.description}</p>
        )}
      </header>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {form.fields.map((f) => (
          <FieldRenderer key={f.id} field={f} value={values[f.id]} onChange={(v) => setVal(f.id, v)} />
        ))}

        {/* Honeypot field · hidden visually, bots fill it */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }}
          onChange={(ev) => setVal('website', ev.target.value)}
          value={(values['website'] as string) || ''}
        />

        {errors.length > 0 && (
          <div className="rounded-md border border-danger bg-danger-soft p-3 text-[12.5px] text-danger">
            <ul className="list-disc pl-5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-lg justify-center"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
          {submitting ? 'Enviando…' : 'Enviar'}
        </button>

        <p className="text-center text-[11px] muted">
          Habeas Data Ley 1581/2012 · tus datos solo serán usados para contactarte sobre tu consulta.
        </p>
      </form>
    </div>
  );
}

function FieldRenderer({
  field, value, onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const v = (value as any) ?? '';
  const baseInputClass = 'input w-full';

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12.5px] font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-danger">*</span>}
      </span>
      {field.help && <span className="text-[11px] muted">{field.help}</span>}

      {field.kind === 'textarea' ? (
        <textarea
          className={cn(baseInputClass, 'min-h-[120px]')}
          rows={5}
          required={field.required}
          placeholder={field.placeholder}
          value={v}
          onChange={(ev) => onChange(ev.target.value)}
        />
      ) : field.kind === 'select' ? (
        <select
          className={baseInputClass}
          required={field.required}
          value={v}
          onChange={(ev) => onChange(ev.target.value)}
        >
          <option value="">— Seleccionar —</option>
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
                required={field.required}
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
            required={field.required}
            checked={!!v}
            onChange={(ev) => onChange(ev.target.checked)}
          />
          <span className="muted">{field.placeholder || 'Acepto'}</span>
        </label>
      ) : field.kind === 'date' ? (
        <input
          type="date"
          className={baseInputClass}
          required={field.required}
          value={v}
          onChange={(ev) => onChange(ev.target.value)}
        />
      ) : field.kind === 'number' ? (
        <input
          type="number"
          className={baseInputClass}
          required={field.required}
          placeholder={field.placeholder}
          value={v}
          onChange={(ev) => onChange(ev.target.value)}
        />
      ) : (
        <input
          type={field.kind === 'email' ? 'email' : field.kind === 'phone' ? 'tel' : 'text'}
          className={baseInputClass}
          required={field.required}
          placeholder={field.placeholder}
          value={v}
          onChange={(ev) => onChange(ev.target.value)}
        />
      )}
    </label>
  );
}
