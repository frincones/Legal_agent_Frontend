'use client';

/**
 * Sprint E · ClauseReviewPanel
 *
 * Panel de revisión cláusula-por-cláusula · invoca skill /revisar/contrato
 * y renderiza output structured con severity GREEN/YELLOW/RED.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2, FileText, AlertCircle, CheckCircle2, Play,
  Sparkles, Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClauseReviewBadge } from './ClauseReviewBadge';

type Clause = {
  index: number;
  title: string;
  category?: string;
  text: string;
  severity: 'green' | 'yellow' | 'red';
  reason?: string;
  suggested_text?: string;
  citations?: string[];
};

type ReviewResult = {
  summary: string;
  risk_score: number;
  clauses: Clause[];
  severity_summary: { green: number; yellow: number; red: number };
  missing_clauses?: string[];
  warnings?: any[];
};

export function ClauseReviewPanel({
  matterId,
  documentId,
  documentTitle,
  onGenerateRedline,
  onSendToSignature,
}: {
  matterId: string;
  documentId: string;
  documentTitle?: string;
  onGenerateRedline?: (clauses: Clause[]) => void;
  onSendToSignature?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/skills/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: '/revisar/contrato',
          matter_id: matterId,
          document_id: documentId,
          input: { matter_titulo: documentTitle },
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const msg = body?.detail?.reason || body?.detail || `Error ${r.status}`;
        setError(typeof msg === 'string' ? msg : 'Error');
        return;
      }
      const data = await r.json();
      const out = data.output as ReviewResult;
      setResult(out);
      if (data.warnings?.length) {
        toast.message(`Revisión con ${data.warnings.length} advertencia(s)`);
      } else {
        toast.success('Revisión completada');
      }
    } catch (e: any) {
      setError(e?.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, [matterId, documentId, documentTitle]);

  return (
    <div className="surface p-4 grid gap-3">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="serif text-[15px] font-semibold flex items-center gap-2">
            <FileText size={15} /> Revisión cláusula por cláusula
          </h3>
          {documentTitle && (
            <p className="text-[12px] muted mt-0.5">Doc: {documentTitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={runReview}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Revisando…</>
          ) : (
            <><Play size={14} /> {result ? 'Re-revisar' : 'Revisar'}</>
          )}
        </button>
      </header>

      {error && (
        <div className="surface bg-danger-soft/30 p-3 text-[12px]">
          <AlertCircle size={14} className="inline mr-1.5" />
          {error}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-8">
          <Sparkles className="mx-auto h-10 w-10 text-ink-3 mb-2" />
          <p className="text-[12.5px] muted">
            Click "Revisar" para analizar cláusula por cláusula con el playbook del despacho.
          </p>
        </div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="surface p-2">
              <div className="text-[11px] muted">Score</div>
              <div className={`serif text-[20px] font-semibold ${
                result.risk_score >= 7 ? 'text-danger' :
                result.risk_score >= 4 ? 'text-warn' : 'text-ok'
              }`}>
                {result.risk_score?.toFixed(1)}
              </div>
              <div className="text-[10px] muted">/ 10</div>
            </div>
            <div className="surface p-2 bg-ok-soft/20">
              <div className="text-[11px] muted">🟢 OK</div>
              <div className="serif text-[20px] font-semibold text-ok">
                {result.severity_summary?.green ?? 0}
              </div>
            </div>
            <div className="surface p-2 bg-warn-soft/20">
              <div className="text-[11px] muted">🟡 Atención</div>
              <div className="serif text-[20px] font-semibold text-warn">
                {result.severity_summary?.yellow ?? 0}
              </div>
            </div>
            <div className="surface p-2 bg-danger-soft/20">
              <div className="text-[11px] muted">🔴 Riesgo</div>
              <div className="serif text-[20px] font-semibold text-danger">
                {result.severity_summary?.red ?? 0}
              </div>
            </div>
          </div>

          {result.summary && (
            <p className="text-[12.5px] text-ink-2 italic border-l-2 border-l-accent pl-3">
              {result.summary}
            </p>
          )}

          {result.missing_clauses && result.missing_clauses.length > 0 && (
            <div className="surface bg-warn-soft/30 p-3">
              <div className="flex items-center gap-1.5 text-[12px] font-medium">
                <AlertCircle size={13} />
                Cláusulas obligatorias faltantes ({result.missing_clauses.length})
              </div>
              <ul className="mt-1 text-[11.5px] muted">
                {result.missing_clauses.map((c, i) => (
                  <li key={i}>· {c}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            {(result.clauses || []).map(clause => (
              <div key={clause.index} className="surface p-3 grid gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-[12px] font-mono muted">#{clause.index}</span>
                    <span className="serif text-[13px] font-semibold truncate">{clause.title}</span>
                    <ClauseReviewBadge severity={clause.severity} reason={clause.reason} />
                    {clause.category && (
                      <span className="chip text-[10px]">{clause.category}</span>
                    )}
                  </div>
                </div>
                <p className="text-[11.5px] text-ink-2 line-clamp-2">{clause.text}</p>
                {clause.reason && (
                  <p className="text-[11.5px] text-warn">⚠️ {clause.reason}</p>
                )}
                {clause.suggested_text && (
                  <details className="text-[11.5px]">
                    <summary className="cursor-pointer text-accent">Sugerencia</summary>
                    <div className="mt-1 bg-ok-soft/30 p-2 rounded">{clause.suggested_text}</div>
                  </details>
                )}
                {clause.citations && clause.citations.length > 0 && (
                  <div className="text-[11px] flex gap-1 flex-wrap">
                    {clause.citations.map((c, i) => (
                      <span key={i} className="chip chip-blue text-[10px] mono">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {(onGenerateRedline || onSendToSignature) && (
            <div className="flex gap-2 pt-2 border-t">
              {onGenerateRedline && (
                <button
                  type="button"
                  onClick={() => onGenerateRedline(result.clauses)}
                  className="btn btn-primary flex-1"
                >
                  <Sparkles size={13} /> Generar redline completo
                </button>
              )}
              {onSendToSignature && (
                <button
                  type="button"
                  onClick={onSendToSignature}
                  className="btn flex-1"
                >
                  <Send size={13} /> Enviar a firma (DocuSign)
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
