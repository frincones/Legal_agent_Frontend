'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Search, ShieldQuestion, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type ValidationResult = {
  id: string;
  subject_kind: 'persona' | 'empresa';
  subject_id_kind: string;
  subject_id_value: string;
  subject_name: string | null;
  providers_used: string[];
  status: 'matched' | 'mismatch' | 'partial' | 'not_found' | 'error';
  results: Record<string, {
    provider: string;
    status: string;
    payload: Record<string, unknown>;
    source: string;
  }>;
  mismatches: Array<{
    provider: string;
    field: string;
    expected: string;
    found: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  summary: string;
  created_at: string;
};

const STATUS_TONE = {
  matched: { color: 'text-ok', bg: 'bg-ok-soft', label: 'Identidad validada', icon: CheckCircle2 },
  mismatch: { color: 'text-danger', bg: 'bg-danger-soft', label: 'Inconsistencia detectada', icon: AlertCircle },
  partial: { color: 'text-warn', bg: 'bg-warn-soft', label: 'Coincidencia parcial', icon: ShieldQuestion },
  not_found: { color: 'text-danger', bg: 'bg-danger-soft', label: 'No encontrado', icon: AlertCircle },
  error: { color: 'text-ink-3', bg: 'bg-bg-sunken', label: 'Error', icon: AlertCircle },
} as const;

/**
 * Sprint 21 · Formulario de validación cruzada de identidad.
 *
 * Llama a Registro Civil + RUE + RUT (según tipo de sujeto) y muestra
 * resultado consolidado.
 */
export function IdentityValidatorForm({
  matterId,
  matterDocumentId,
  defaultSubjectName,
  defaultSubjectIdValue,
  onResult,
  className,
}: {
  matterId?: string;
  matterDocumentId?: string;
  defaultSubjectName?: string;
  defaultSubjectIdValue?: string;
  onResult?: (r: ValidationResult) => void;
  className?: string;
}) {
  const [subjectKind, setSubjectKind] = useState<'persona' | 'empresa'>('persona');
  const [subjectIdKind, setSubjectIdKind] = useState<'cedula' | 'nit' | 'pasaporte' | 'rut' | 'otro'>('cedula');
  const [subjectIdValue, setSubjectIdValue] = useState(defaultSubjectIdValue || '');
  const [subjectName, setSubjectName] = useState(defaultSubjectName || '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  async function run() {
    if (!subjectIdValue.trim()) {
      toast.error('Necesito un número de identificación');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch('/api/evidence/validate-identity', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subject_kind: subjectKind,
          subject_id_kind: subjectIdKind,
          subject_id_value: subjectIdValue.trim(),
          subject_name: subjectName.trim() || null,
          matter_id: matterId || null,
          matter_document_id: matterDocumentId || null,
        }),
      });
      if (r.ok) {
        const data: ValidationResult = await r.json();
        setResult(data);
        onResult?.(data);
        toast.success('Validación completada');
      } else {
        const data = await r.json().catch(() => ({}));
        toast.error(data.detail || 'No se pudo validar');
      }
    } finally {
      setBusy(false);
    }
  }

  const tone = result ? STATUS_TONE[result.status] : null;

  return (
    <section className={cn('surface p-[var(--pad-card)]', className)}>
      <header className="mb-3">
        <h3 className="serif m-0 text-[15px] font-semibold">Validación cruzada de identidad</h3>
        <p className="text-[11.5px] muted">
          Verifica contra Registro Civil · RUE · RUT (DIAN). Detecta inconsistencias antes
          de presentar evidencia al juez.
        </p>
      </header>

      <div className="grid gap-2">
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Tipo</span>
            <select
              className="input"
              value={subjectKind}
              onChange={(ev) => {
                const k = ev.target.value as 'persona' | 'empresa';
                setSubjectKind(k);
                setSubjectIdKind(k === 'empresa' ? 'nit' : 'cedula');
              }}
              disabled={busy}
            >
              <option value="persona">Persona natural</option>
              <option value="empresa">Empresa (persona jurídica)</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Documento</span>
            <select
              className="input"
              value={subjectIdKind}
              onChange={(ev) => setSubjectIdKind(ev.target.value as typeof subjectIdKind)}
              disabled={busy}
            >
              <option value="cedula">Cédula</option>
              <option value="nit">NIT</option>
              <option value="pasaporte">Pasaporte</option>
              <option value="rut">RUT</option>
              <option value="otro">Otro</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Número de identificación
          </span>
          <input
            className="input"
            placeholder={subjectKind === 'persona' ? '52123456' : '900111222'}
            value={subjectIdValue}
            onChange={(ev) => setSubjectIdValue(ev.target.value)}
            disabled={busy}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Nombre o razón social
          </span>
          <input
            className="input"
            placeholder={subjectKind === 'persona' ? 'María González' : 'EMPRESA DEMO SAS'}
            value={subjectName}
            onChange={(ev) => setSubjectName(ev.target.value)}
            disabled={busy}
          />
        </label>
        <button
          className="btn btn-primary btn-sm self-start"
          onClick={run}
          disabled={busy || !subjectIdValue.trim()}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {busy ? 'Validando…' : 'Validar identidad'}
        </button>
      </div>

      {result && tone && (
        <div className={cn('mt-4 rounded-md border border-line p-3', tone.bg)}>
          <header className="flex items-center gap-2">
            <tone.icon size={16} className={tone.color} />
            <span className={cn('text-[13px] font-semibold', tone.color)}>{tone.label}</span>
            <span className="ml-auto text-[10.5px] muted">
              Providers: {result.providers_used.join(', ')}
            </span>
          </header>
          <p className="mt-1 text-[12.5px]">{result.summary}</p>

          {result.mismatches.length > 0 && (
            <div className="mt-2">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-danger">
                Inconsistencias
              </div>
              <ul className="mt-1 flex flex-col gap-1">
                {result.mismatches.map((m, i) => (
                  <li key={i} className="text-[11.5px]">
                    <span className="mono text-ink-3">{m.provider}</span>
                    {' · '}
                    <span className="font-medium">{m.field}:</span>{' '}
                    esperado <span className="text-warn">"{m.expected}"</span>{' '}
                    · oficial <span className="text-ink">"{m.found}"</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] text-accent hover:underline">
              Ver respuesta completa de cada provider
            </summary>
            <div className="mt-2 grid gap-2">
              {Object.entries(result.results).map(([provider, r]) => (
                <div key={provider} className="rounded-md bg-bg-elev p-2 text-[11.5px]">
                  <div className="mb-1 font-medium">{provider} · status: {r.status} ({r.source})</div>
                  <pre className="mono text-[10px] text-ink-3 overflow-x-auto">
                    {JSON.stringify(r.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
