'use client';

/**
 * Sprint M21.S3.B · ColdStartWizard
 *
 * Wizard de 4 partes (identidad / areas / pain points / seed docs) que orquesta
 * el state-machine del backend cold_start_interview tool via lib/api/v2/onboarding.
 *
 * Estados:
 *   - loading (carga inicial / fetch session)
 *   - in_progress (mostrando Parte N con questions)
 *   - submitting (POST answer en curso)
 *   - ready_to_finish (4 partes respondidas, esperando confirm)
 *   - completed (firm profile + practice areas persistidos)
 *   - error (mensaje arriba, retry posible)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  startColdStart, answerColdStart, finishColdStart, abandonColdStart,
  type ColdStartStatus, type ColdStartQuestion,
} from '@/lib/api/v2/onboarding';

type Props = {
  onCompleted?: (result: { session_id: string; areas_count: number }) => void;
};

export default function ColdStartWizard({ onCompleted }: Props) {
  const [status, setStatus] = useState<ColdStartStatus | null>(null);
  const [phase, setPhase] = useState<'loading' | 'in_progress' | 'submitting' | 'ready' | 'done' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  const loadOrStart = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      const s = await startColdStart();
      setStatus(s);
      setDraft({});
      if (s.status === 'completed') {
        setPhase('done');
      } else if (s.status === 'ready_to_finish') {
        setPhase('ready');
      } else {
        setPhase('in_progress');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, []);

  useEffect(() => { void loadOrStart(); }, [loadOrStart]);

  const handleSubmitPart = async () => {
    if (!status?.session_id) return;
    setBusy(true);
    setError(null);
    try {
      const next = await answerColdStart(status.session_id, draft);
      setStatus(next);
      setDraft({});
      setPhase(next.status === 'ready_to_finish' ? 'ready' : 'in_progress');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    if (!status?.session_id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await finishColdStart(status.session_id);
      setPhase('done');
      onCompleted?.({
        session_id: res.session_id,
        areas_count: res.practice_sections_inserted?.length ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleAbandon = async () => {
    if (!status?.session_id) return;
    try {
      await abandonColdStart(status.session_id);
      await loadOrStart();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // ─── Render ────────────────────────────────────────────────

  if (phase === 'loading') {
    return <div className="text-sm text-zinc-500 p-6">Cargando onboarding…</div>;
  }
  if (phase === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <div className="font-medium mb-2">No se pudo iniciar la entrevista</div>
        <pre className="text-xs whitespace-pre-wrap mb-3">{error}</pre>
        <button onClick={() => void loadOrStart()} className="rounded bg-red-600 text-white text-xs px-3 py-1.5">
          Reintentar
        </button>
      </div>
    );
  }
  if (phase === 'done') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <div className="text-base font-semibold text-emerald-900 mb-1">Onboarding completado</div>
        <p className="text-sm text-emerald-800 mb-4">
          Tu firma ya tiene un company profile y las áreas de práctica registradas. LexAI personalizará
          documentos y consultas con este contexto.
        </p>
        <div className="flex gap-2">
          <a href="/v2/matters"
             className="rounded bg-emerald-700 text-white text-sm px-4 py-2 hover:bg-emerald-800">
            Ir a Mis casos
          </a>
          <a href="/v2/inicio"
             className="rounded border border-emerald-300 text-emerald-800 text-sm px-4 py-2 hover:bg-emerald-100">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }
  if (phase === 'ready') {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="text-base font-semibold mb-2">Listo para confirmar</div>
        <p className="text-sm text-zinc-600 mb-4">
          Respondiste las 4 partes del onboarding. Al confirmar, se persistirán tu company profile
          y las áreas de práctica para que LexAI personalice los outputs.
        </p>
        {error && <div className="mb-3 rounded bg-red-50 text-red-700 text-xs p-3">{error}</div>}
        <div className="flex gap-2">
          <button onClick={() => void handleFinish()}
                  disabled={busy}
                  className="rounded bg-zinc-900 text-white text-sm px-4 py-2 hover:bg-zinc-800 disabled:opacity-50">
            Confirmar y guardar
          </button>
          <button onClick={() => void handleAbandon()}
                  className="rounded border border-zinc-300 text-zinc-700 text-sm px-4 py-2 hover:bg-zinc-50">
            Empezar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // in_progress / submitting
  const part = status!.current_part;
  const total = status!.total_parts;
  const questions: ColdStartQuestion[] = status?.questions ?? [];
  const progressPct = total > 0 ? Math.round((part / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">{status?.part_label ?? `Parte ${part + 1}`}</h2>
          <span className="text-xs text-zinc-500">Parte {part + 1} de {total}</span>
        </div>
        <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {status?.resumed && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
            Retomando sesión anterior
          </p>
        )}
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmitPart();
        }}
        className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5"
      >
        {questions.map((q) => (
          <FieldRenderer
            key={q.key}
            question={q}
            value={draft[q.key]}
            onChange={(v) => setDraft((d) => ({ ...d, [q.key]: v }))}
          />
        ))}

        {error && <div className="rounded bg-red-50 text-red-700 text-xs p-3">{error}</div>}

        <div className="flex gap-2 pt-2">
          <button type="submit"
                  disabled={busy}
                  className="rounded bg-zinc-900 text-white text-sm px-4 py-2 hover:bg-zinc-800 disabled:opacity-50">
            {busy ? 'Guardando…' : 'Siguiente'}
          </button>
          <button type="button"
                  onClick={() => void handleAbandon()}
                  className="rounded border border-zinc-300 text-zinc-700 text-sm px-4 py-2 hover:bg-zinc-50">
            Empezar de nuevo
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Renderer por tipo de pregunta ───────────────────────────

function FieldRenderer({
  question,
  value,
  onChange,
}: {
  question: ColdStartQuestion;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const isLong = question.key === 'pain_points_md' || question.key === 'tools_currently_used' ||
                 question.key === 'compliance_concerns';
  const id = `q-${question.key}`;
  const required = question.required;

  if (question.type === 'boolean') {
    return (
      <div>
        <label className="text-sm font-medium text-zinc-800 mb-1 block">
          {question.q}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange(true)}
                  className={`rounded border px-3 py-1.5 text-sm ${value === true ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-300 text-zinc-700'}`}>
            Sí
          </button>
          <button type="button" onClick={() => onChange(false)}
                  className={`rounded border px-3 py-1.5 text-sm ${value === false ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-300 text-zinc-700'}`}>
            No
          </button>
        </div>
      </div>
    );
  }

  if (question.type === 'array' || question.key === 'practice_areas') {
    const arr = Array.isArray(value) ? (value as string[]) : (typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
    return (
      <div>
        <label htmlFor={id} className="text-sm font-medium text-zinc-800 mb-1 block">
          {question.q}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          id={id}
          type="text"
          placeholder="separa con comas: notarial, judicial_laboral, contractual"
          defaultValue={arr.join(', ')}
          onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
        />
      </div>
    );
  }

  if (question.type === 'integer') {
    return (
      <div>
        <label htmlFor={id} className="text-sm font-medium text-zinc-800 mb-1 block">
          {question.q}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          id={id}
          type="number" min={0}
          value={typeof value === 'number' ? value : (value as string ?? '')}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="w-32 rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
        />
      </div>
    );
  }

  if (isLong) {
    return (
      <div>
        <label htmlFor={id} className="text-sm font-medium text-zinc-800 mb-1 block">
          {question.q}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <textarea
          id={id}
          rows={4}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 resize-y"
        />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-zinc-800 mb-1 block">
        {question.q}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={typeof value === 'string' ? value : ''}
        placeholder={question.default}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
      />
    </div>
  );
}
