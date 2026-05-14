'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Gauge, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { IdentityValidatorForm } from './IdentityValidatorForm';
import { InconsistencyList, type InconsistencyAnalysis } from './InconsistencyList';
import { ProbativeScoreCard, type ProbativeScore } from './ProbativeScoreCard';

type MatterDoc = {
  id: string;
  titulo: string;
  kind: string;
  resumen_ia: string | null;
};

/**
 * Sprint 21 · Panel completo de verificación de evidencia.
 *
 * Sección 1: Validación de identidad (cédula/NIT + nombre).
 * Sección 2: Detección de inconsistencias en el documento (LLM).
 * Sección 3: Score probatorio (combina todo + features del doc).
 *
 * Modo standalone (sin matter_document_id) sólo expone la sección 1
 * para revisar identidades ad-hoc.
 */
export function EvidenceCheckPanel({
  matterId,
  documents,
  className,
}: {
  matterId: string;
  documents?: MatterDoc[];
  className?: string;
}) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    documents && documents.length > 0 ? (documents[0]?.id ?? null) : null,
  );
  const [documentText, setDocumentText] = useState('');
  const [analysis, setAnalysis] = useState<InconsistencyAnalysis | null>(null);
  const [score, setScore] = useState<ProbativeScore | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [running, setRunning] = useState(false);

  // Cargar último análisis al cambiar doc
  const loadExisting = useCallback(async (docId: string) => {
    setLoadingAnalysis(true);
    setLoadingScore(true);
    try {
      const [a, s] = await Promise.all([
        fetch(`/api/evidence/inconsistencies/document/${docId}/latest`, { cache: 'no-store' }),
        fetch(`/api/evidence/scores/document/${docId}/latest`, { cache: 'no-store' }),
      ]);
      if (a.ok) {
        const t = await a.text();
        setAnalysis(t && t !== 'null' ? JSON.parse(t) : null);
      }
      if (s.ok) {
        const t = await s.text();
        setScore(t && t !== 'null' ? JSON.parse(t) : null);
      }
    } finally {
      setLoadingAnalysis(false);
      setLoadingScore(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDocId) void loadExisting(selectedDocId);
    else {
      setAnalysis(null);
      setScore(null);
    }
  }, [selectedDocId, loadExisting]);

  // Pre-llenar documentText con resumen_ia del doc seleccionado
  useEffect(() => {
    if (!documents || !selectedDocId) return;
    const doc = documents.find((d) => d.id === selectedDocId);
    if (doc?.resumen_ia && documentText.length === 0) {
      setDocumentText(doc.resumen_ia);
    }
  }, [selectedDocId, documents, documentText.length]);

  async function runFullCheck() {
    if (!selectedDocId) {
      toast.error('Selecciona un documento');
      return;
    }
    if (!documentText.trim() || documentText.length < 100) {
      toast.error('Pega el texto del documento (mínimo 100 caracteres)');
      return;
    }
    setRunning(true);
    try {
      // Run inconsistency + score (score auto-corre inconsistencies internamente)
      const r = await fetch('/api/evidence/score', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          matter_document_id: selectedDocId,
          document_text: documentText.trim(),
          matter_id: matterId,
          auto_run_inconsistencies: true,
        }),
      });
      if (r.ok) {
        const scoreData = await r.json();
        setScore(scoreData);
        toast.success(`Score: ${scoreData.probative_score}/100 · ${scoreData.level}`);
        // Refresh inconsistencies
        void loadExisting(selectedDocId);
      } else {
        const data = await r.json().catch(() => ({}));
        toast.error(data.detail || 'No se pudo analizar');
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <header>
        <h2 className="serif m-0 text-[16px] font-semibold">Verificación de evidencia</h2>
        <p className="text-[12px] muted">
          Tres análisis combinados antes de presentar evidencia al juez · identidad
          cruzada · inconsistencias del documento · score probatorio.
        </p>
      </header>

      {/* Sección 1 · Validación de identidad */}
      <IdentityValidatorForm matterId={matterId} />

      {/* Documento selector */}
      {documents && documents.length > 0 && (
        <section className="surface p-[var(--pad-card)]">
          <header className="mb-2">
            <h3 className="serif m-0 text-[15px] font-semibold">Documento a analizar</h3>
            <p className="text-[11.5px] muted">
              Selecciona un documento del caso y proporciona su texto (resumen IA o paste manual).
            </p>
          </header>
          <div className="grid gap-2">
            <select
              className="input"
              value={selectedDocId || ''}
              onChange={(ev) => setSelectedDocId(ev.target.value || null)}
            >
              <option value="">— Selecciona un documento —</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.kind}] {d.titulo}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Pega el texto del documento aquí (mín 100 caracteres). Si el doc ya tiene resumen IA, se pre-rellena automáticamente."
              value={documentText}
              onChange={(ev) => setDocumentText(ev.target.value)}
              rows={6}
              className="input min-h-[120px]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] muted">
                {documentText.length.toLocaleString('es-CO')} caracteres
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={runFullCheck}
                disabled={running || !selectedDocId || documentText.length < 100}
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {running ? 'Analizando…' : 'Analizar consistencia + score'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Sección 2 · Inconsistencias */}
      {selectedDocId && (
        loadingAnalysis ? (
          <div className="surface flex items-center gap-2 p-3 text-[12px] muted">
            <Loader2 className="animate-spin" size={14} /> Cargando análisis…
          </div>
        ) : analysis ? (
          <InconsistencyList analysis={analysis} />
        ) : (
          <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
            <FileText size={14} /> Aún no hay análisis de consistencia para este documento.
            Pulsa "Analizar" arriba.
          </div>
        )
      )}

      {/* Sección 3 · Score */}
      {selectedDocId && (
        loadingScore ? (
          <div className="surface flex items-center gap-2 p-3 text-[12px] muted">
            <Loader2 className="animate-spin" size={14} /> Cargando score…
          </div>
        ) : score ? (
          <ProbativeScoreCard score={score} />
        ) : (
          <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
            <Gauge size={14} /> Score probatorio sin computar todavía. Análisis completo
            generará score automáticamente.
          </div>
        )
      )}
    </div>
  );
}
