'use client';

/**
 * F4-T04 · MatterExecutiveSummary — Resumen ejecutivo generado por el agente.
 *
 * Invoca /v1/skills/execute con skill='/ask' y un prompt de resumen.
 * Cache con SWR stale 5 minutos. Loading: 3 párrafos skeleton.
 * Error: mensaje de fallback sin romper la experiencia.
 */

import { useEffect, useRef, useState } from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  matterId: string;
  matterTitulo?: string;
}

function SummarySkeletons() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Generando resumen ejecutivo">
      {[100, 90, 75].map((w, i) => (
        <div key={i} className="space-y-1.5">
          <div
            className="h-3 animate-pulse rounded"
            style={{ width: `${w}%`, background: 'var(--v2-bg-muted, #E8E7E1)' }}
          />
          <div
            className="h-3 animate-pulse rounded"
            style={{ width: `${Math.max(40, w - 20)}%`, background: 'var(--v2-bg-muted, #E8E7E1)' }}
          />
          {i < 2 && (
            <div
              className="h-3 animate-pulse rounded"
              style={{ width: `${Math.max(30, w - 35)}%`, background: 'var(--v2-bg-muted, #E8E7E1)' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Caché en memoria por sesión (se resetea al recargar — SWR-like, sin dependencias extra)
const summaryCache = new Map<string, { text: string; ts: number }>();
const STALE_MS = 5 * 60 * 1000; // 5 minutos

export function MatterExecutiveSummary({ matterId, matterTitulo }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = async (force = false) => {
    // Verificar caché
    if (!force) {
      const cached = summaryCache.get(matterId);
      if (cached && Date.now() - cached.ts < STALE_MS) {
        setSummary(cached.text);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(false);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const prompt = `Genera un resumen ejecutivo del caso ${matterTitulo ? `"${matterTitulo}"` : ''} (ID: ${matterId}) en 2 o 3 párrafos breves. Menciona la etapa procesal actual, las partes principales, las próximas acciones críticas y los riesgos más relevantes. No uses Markdown ni listas. Escribe en prosa directa y profesional.`;

      const res = await fetch('/api/skills/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: prompt,
          matter_id: matterId,
          context: { matter_id: matterId },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json().catch(() => null);
      // Backend /v1/skills/execute responde { output: { text: "..." } }.
      // Mantenemos fallbacks por si el contrato cambia o tests usan otro shape.
      const text: string =
        data?.output?.text ??
        data?.output?.message_md ??
        (typeof data?.output === 'string' ? data.output : undefined) ??
        data?.text ??
        data?.result ??
        data?.response ??
        '';

      if (text && text.length > 20) {
        summaryCache.set(matterId, { text, ts: Date.now() });
        setSummary(text);
      } else {
        setError(true);
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matterId]);

  return (
    <div
      className="mx-6 my-5 rounded-xl border p-5"
      style={{
        borderColor: 'var(--v2-bg-muted, #E8E7E1)',
        background: 'var(--v2-bg-surface, #FFFFFF)',
      }}
    >
      {/* Header del agente */}
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="grid h-8 w-8 flex-none place-items-center rounded-full text-white"
          style={{ background: 'var(--v2-brand-navy, #0E2A5E)' }}
          aria-hidden="true"
        >
          <Bot size={16} strokeWidth={1.8} />
        </span>
        <div>
          <div
            className="text-[13px] font-semibold"
            style={{
              color: 'var(--v2-text-primary, #1A1916)',
              fontFamily: 'var(--v2-font-serif, Georgia, serif)',
            }}
          >
            LexAI
          </div>
          <div className="text-[11px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
            Resumen ejecutivo del caso
          </div>
        </div>

        {/* Botón refrescar (solo cuando hay contenido) */}
        {!loading && (
          <button
            type="button"
            onClick={() => load(true)}
            className={cn(
              'ml-auto rounded-lg p-1.5 transition-colors duration-150',
              'hover:bg-[var(--v2-bg-subtle,#F2F1EC)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
            )}
            style={{
              color: 'var(--v2-text-secondary, #4A4944)',
              outlineColor: 'var(--v2-brand-navy, #0E2A5E)',
            }}
            title="Regenerar resumen"
            aria-label="Regenerar resumen ejecutivo"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>

      {/* Contenido */}
      {loading && <SummarySkeletons />}

      {!loading && error && (
        <p
          className="text-[13px] italic"
          style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
        >
          No se pudo generar el resumen. Continúe con las secciones de abajo.
        </p>
      )}

      {!loading && !error && summary && (
        <div
          className="space-y-3 text-[14px] leading-relaxed"
          style={{
            color: 'var(--v2-text-primary, #1A1916)',
            fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
          }}
        >
          {summary
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="m-0">
                {para.trim()}
              </p>
            ))}
        </div>
      )}

      {/* Disclaimer legal */}
      {!loading && !error && summary && (
        <div
          className="mt-4 rounded-md px-3 py-2 text-[11px] leading-snug"
          style={{
            background: 'var(--v2-bg-subtle, #F2F1EC)',
            color: 'var(--v2-text-secondary, #4A4944)',
          }}
        >
          Resumen generado con IA. No constituye concepto legal. Validado por el abogado titulado del despacho.
        </div>
      )}
    </div>
  );
}
