'use client';

/**
 * TemplateSearchPicker — semantic search UI for the system catalog +
 * firm templates. Used inside:
 *   - GenerateWritDialog (Sprint 3 tab "Con plantilla")
 *   - Assistant slash menu (Sprint 3)
 *   - /settings/templates "Catálogo Colombia" tab (Sprint 2)
 *
 * Behavior:
 *   - Debounced input (300ms) calls /api/templates/search
 *   - Renders ranked hits with quality_score + materia + system badge
 *   - onSelect prop fires with the full hit so the caller decides what to do
 *
 * Composition notes:
 *   - Pure controlled component · stateless on selection
 *   - No external store dependency · easy to mount in dialogs
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  searchTemplates,
  type TemplateSearchHit,
} from '@/lib/api/templates';

interface TemplateSearchPickerProps {
  /** Optional initial query to populate the input. */
  initialQuery?: string;
  /** Optional materia filter (defaults to no filter). */
  materia?: string;
  /** Optional doc_type filter. */
  docType?: string;
  /** Result count cap (default 10). */
  limit?: number;
  /** Only show system templates (firm_id IS NULL). */
  systemOnly?: boolean;
  /** Fired when the user picks a result. */
  onSelect?: (hit: TemplateSearchHit) => void;
  /** Optional auto-focus on mount (default true). */
  autoFocus?: boolean;
}

const DEBOUNCE_MS = 300;

export function TemplateSearchPicker({
  initialQuery = '',
  materia,
  docType,
  limit = 10,
  systemOnly = false,
  onSelect,
  autoFocus = true,
}: TemplateSearchPickerProps) {
  const [q, setQ] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<TemplateSearchHit[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const params = useMemo(
    () => ({ q, materia, doc_type: docType, limit, include_firm: !systemOnly }),
    [q, materia, docType, limit, systemOnly],
  );

  // Debounced search.
  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setHits([]);
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      try {
        const res = await searchTemplates(params, { signal: ac.signal });
        setHits(res.results);
        setActiveIdx(0);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : String(e));
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [params, q]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(hits.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && hits[activeIdx]) {
        e.preventDefault();
        onSelect?.(hits[activeIdx]);
      }
    },
    [hits, activeIdx, onSelect],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="border-line bg-bg-elev flex items-center gap-2 rounded-md border px-2 py-1.5 focus-within:border-accent/60">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink-3 h-4 w-4 shrink-0"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder='Buscar plantilla… (ej. "demanda laboral despido")'
          className="text-ink placeholder:text-ink-3 flex-1 bg-transparent text-sm outline-none"
          aria-label="Buscar plantilla"
        />
        {loading && (
          <span className="text-ink-3 text-xs italic" aria-live="polite">
            buscando…
          </span>
        )}
      </div>

      {error && (
        <div className="bg-danger-soft text-danger rounded-sm px-2 py-1 text-xs">
          {error}
        </div>
      )}

      {!loading && !error && q.trim().length >= 2 && hits.length === 0 && (
        <div className="text-ink-3 px-2 py-3 text-center text-xs italic">
          Sin resultados. Prueba con otros términos o crea una plantilla nueva
          en Configuración → Plantillas.
        </div>
      )}

      {hits.length > 0 && (
        <ul
          role="listbox"
          aria-label="Resultados de plantillas"
          className="border-line bg-bg flex max-h-[360px] flex-col gap-1 overflow-y-auto rounded-md border p-1"
        >
          {hits.map((hit, idx) => (
            <HitRow
              key={hit.template_id}
              hit={hit}
              active={idx === activeIdx}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => onSelect?.(hit)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface HitRowProps {
  hit: TemplateSearchHit;
  active: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

function HitRow({ hit, active, onMouseEnter, onClick }: HitRowProps) {
  return (
    <li
      role="option"
      aria-selected={active}
      tabIndex={-1}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={[
        'flex cursor-pointer flex-col gap-1 rounded-sm px-2 py-2 transition-colors',
        active ? 'bg-accent-soft' : 'hover:bg-bg-sunken',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-ink text-sm font-medium leading-tight">
          {hit.name}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {hit.is_system && (
            <span className="bg-purple-soft text-purple rounded-sm px-1.5 py-0.5 text-[10px]">
              Sistema
            </span>
          )}
          {hit.quality_score != null && (
            <span
              className={[
                'rounded-sm px-1.5 py-0.5 text-[10px]',
                hit.quality_score >= 0.85
                  ? 'bg-ok-soft text-ok'
                  : hit.quality_score >= 0.7
                  ? 'bg-warn-soft text-warn'
                  : 'bg-bg-sunken text-ink-3',
              ].join(' ')}
              title={`Quality score: ${hit.quality_score.toFixed(2)}`}
            >
              {Math.round(hit.quality_score * 100)}%
            </span>
          )}
        </div>
      </div>
      <div className="text-ink-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        {hit.materia && (
          <span className="bg-bg-sunken rounded-sm px-1.5 py-0.5">
            {hit.materia}
          </span>
        )}
        <span>·</span>
        <span>{hit.doc_type}</span>
        {hit.subtype && (
          <>
            <span>·</span>
            <span className="opacity-70">{hit.subtype}</span>
          </>
        )}
      </div>
      <p className="text-ink-3 line-clamp-2 text-xs leading-snug">
        {hit.snippet}
      </p>
      {hit.applicable_norms.length > 0 && (
        <div className="text-ink-3 flex flex-wrap gap-1 pt-0.5 text-[10px]">
          {hit.applicable_norms.slice(0, 3).map((n) => (
            <span
              key={n}
              className="border-line rounded-sm border px-1 py-0.5 font-mono"
            >
              {n}
            </span>
          ))}
          {hit.applicable_norms.length > 3 && (
            <span className="opacity-60">
              +{hit.applicable_norms.length - 3} más
            </span>
          )}
        </div>
      )}
    </li>
  );
}
