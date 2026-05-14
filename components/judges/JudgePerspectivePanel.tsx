'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { JudgeSearchPicker, type JudgeLite } from './JudgeSearchPicker';
import { JudgeProfileCard } from './JudgeProfileCard';
import { JudgeSimulationResult, type SimulationResult } from './JudgeSimulationResult';

/**
 * Sprint 20 · Panel completo · search → profile → simulate → result.
 *
 * Recibe el matterId. Opcionalmente recibe documentText (cuando se usa
 * desde un canvas activo); si no, el backend compone texto del matter.
 */
export function JudgePerspectivePanel({
  matterId,
  documentText,
  className,
}: {
  matterId: string;
  documentText?: string;
  className?: string;
}) {
  const [judge, setJudge] = useState<JudgeLite | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Auto-cargar última predicción al cambiar de juez
  const loadLatest = useCallback(async (judgeId: string) => {
    setLoadingResult(true);
    try {
      const r = await fetch(
        `/api/judge-predictions/matter/${matterId}/latest?judge_id=${judgeId}`,
        { cache: 'no-store' },
      );
      if (r.ok) {
        const text = await r.text();
        setResult(text && text !== 'null' ? JSON.parse(text) : null);
      }
    } finally {
      setLoadingResult(false);
    }
  }, [matterId]);

  useEffect(() => {
    if (judge) void loadLatest(judge.id);
    else setResult(null);
  }, [judge, loadLatest]);

  async function simulate(useCache = true) {
    if (!judge) {
      toast.error('Selecciona un juez primero');
      return;
    }
    setSimulating(true);
    try {
      const r = await fetch('/api/judge-predictions/simulate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          matter_id: matterId,
          judge_id: judge.id,
          document_text: documentText || null,
          use_cache: useCache,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setResult(data);
        toast.success(data.cached ? 'Predicción cargada de cache' : 'Predicción generada');
      } else {
        const data = await r.json().catch(() => ({}));
        toast.error(data.detail || 'No se pudo simular');
      }
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <header>
        <h2 className="serif m-0 text-[16px] font-semibold">
          Cómo recibiría este juez tu escrito
        </h2>
        <p className="text-[12px] muted">
          La IA analiza el perfil del juez + sus decisiones recientes vs tu escrito y
          predice recepción, fortalezas y factores de riesgo.
        </p>
      </header>

      <div className="rounded-md border border-line bg-bg-elev p-3">
        <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
          1 · Selecciona juez
        </div>
        <JudgeSearchPicker
          selectedId={judge?.id || null}
          onSelect={setJudge}
        />
      </div>

      {judge && (
        <div className="grid gap-3 md:grid-cols-2">
          <JudgeProfileCard judgeId={judge.id} />

          <div className="flex flex-col gap-3">
            <div className="surface flex items-center justify-between p-3">
              <div>
                <div className="text-[12.5px] font-semibold">2 · Simular recepción</div>
                <div className="text-[11px] muted">
                  {documentText
                    ? `${documentText.length.toLocaleString('es-CO')} caracteres del canvas`
                    : 'Tomará contexto del matter (cliente, materia, docs)'}
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => simulate(true)}
                disabled={simulating}
              >
                {simulating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {simulating ? 'Analizando…' : result ? 'Re-analizar' : 'Analizar'}
              </button>
            </div>

            {loadingResult ? (
              <div className="surface flex items-center gap-2 p-3 text-[12px] muted">
                <Loader2 size={14} className="animate-spin" /> Cargando última predicción…
              </div>
            ) : result ? (
              <JudgeSimulationResult result={result} />
            ) : (
              <div className="surface p-6 text-center text-[12.5px] muted">
                Aún no hay predicción para este juez. Pulsa "Analizar".
              </div>
            )}

            {result && (
              <button
                className="btn btn-ghost btn-sm self-end"
                onClick={() => simulate(false)}
                disabled={simulating}
              >
                <RefreshCw size={12} /> Forzar nueva (saltar cache)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
