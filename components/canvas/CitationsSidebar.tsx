'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ExternalLink, Loader2, RefreshCw, Replace } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import {
  citationTypeLabel,
  extractCitations,
  type ExtractedCitation,
} from '@/lib/citations/extract';
import {
  CitationBadge,
  mapBackendStatus,
  type CitationStatus,
} from '@/components/legal/CitationBadge';

/**
 * Live citation verification sidebar.
 *
 * - Subscribes to the canvas store (markdown of the editor).
 * - Extracts legal citations with `extractCitations`.
 * - Calls `/api/citations/verify` (debounced) to verify them against
 *   the backend (which scrapes official sources).
 * - Renders each citation with a status badge + URL link.
 *
 * No hardcoded fixtures. No demo seeds. The previous LiveCanvasShell
 * is retained for marketing/demo decks but no longer used here.
 */

type VerifyResult = {
  citation_ref: string;
  estado?: string;
  juris_id?: string;
  corte?: string;
  rubro?: string;
  vigencia?: string;
  url_oficial?: string;
};

type VerifiedCitation = ExtractedCitation & {
  status: CitationStatus;
  rubro?: string;
  url?: string;
  corte?: string;
  lastChecked?: number;
};

const VERIFY_DEBOUNCE_MS = 1500;

export function CitationsSidebar({ matterId }: { matterId?: string }) {
  const markdown = useCanvasStore((s) => s.markdown);
  const contentVersion = useCanvasStore((s) => s.contentVersion);

  const [verified, setVerified] = useState<Map<string, VerifiedCitation>>(new Map());
  const [verifying, setVerifying] = useState(false);
  const [lastVerifiedAt, setLastVerifiedAt] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRefsRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<AbortController | null>(null);

  // Re-extract refs whenever content changes.
  const extracted = useMemo<ExtractedCitation[]>(
    () => extractCitations(markdown),
    // contentVersion is enough because markdown changes flip it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contentVersion],
  );

  const verifyRefs = useCallback(async (refs: string[]) => {
    if (refs.length === 0) return;
    if (inFlightRef.current) inFlightRef.current.abort();
    const ctrl = new AbortController();
    inFlightRef.current = ctrl;
    setVerifying(true);
    try {
      const res = await fetch('/api/citations/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ citation_refs: refs }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Verify failed (${res.status}): ${errText.slice(0, 120)}`);
      }
      const data = (await res.json()) as VerifyResult[];
      setVerified((prev) => {
        const next = new Map(prev);
        for (const r of data) {
          const existing = next.get(r.citation_ref);
          if (!existing) continue;
          next.set(r.citation_ref, {
            ...existing,
            status: mapBackendStatus(r.estado),
            rubro: r.rubro,
            url: r.url_oficial,
            corte: r.corte,
            lastChecked: Date.now(),
          });
        }
        return next;
      });
      setLastVerifiedAt(Date.now());
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      const msg = e instanceof Error ? e.message : 'Error verificando citas';
      // Avoid noisy toasts for transient errors during typing.
      console.warn('[citations]', msg);
    } finally {
      if (inFlightRef.current === ctrl) inFlightRef.current = null;
      setVerifying(false);
    }
  }, []);

  // Reconcile extracted citations with verified state, then debounce-verify any new refs.
  useEffect(() => {
    setVerified((prev) => {
      const next = new Map<string, VerifiedCitation>();
      for (const c of extracted) {
        const existing = prev.get(c.ref);
        if (existing) {
          next.set(c.ref, existing);
        } else {
          next.set(c.ref, { ...c, status: 'pending' });
          pendingRefsRef.current.add(c.ref);
        }
      }
      return next;
    });
  }, [extracted]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (pendingRefsRef.current.size === 0) return;
    debounceRef.current = setTimeout(() => {
      const refs = Array.from(pendingRefsRef.current);
      pendingRefsRef.current.clear();
      void verifyRefs(refs);
    }, VERIFY_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [contentVersion, verifyRefs]);

  const handleReverifyAll = useCallback(() => {
    // Re-extraer SIEMPRE del documento actual del editor (no del Map cacheado).
    // Solución al bug: cargar un template o cambiar el doc no triggea onUpdate
    // de TipTap si setContent(html, false) se usa, así que el store podía estar
    // desactualizado. Aquí pedimos al editor su markdown actual via uiCommandBus.
    const editorApi = uiCommandBus.getCanvasApi();
    let currentMd = markdown;
    if (editorApi) {
      try {
        const snapshot = editorApi.get_current();
        currentMd = snapshot.markdown || snapshot.text || currentMd;
      } catch {
        /* fallback al store markdown */
      }
    }
    const freshExtracted = extractCitations(currentMd);
    if (freshExtracted.length === 0) {
      toast.info('No hay citas en el documento actual.');
      setVerified(new Map()); // limpiar el Map cuando no hay citas en el doc real
      return;
    }
    // Reemplazar TODO el Map · descartar citas que ya no están en el doc actual
    const next = new Map<string, VerifiedCitation>();
    for (const c of freshExtracted) {
      const existing = verified.get(c.ref);
      next.set(c.ref, {
        ...(existing ?? c),
        ...c,
        status: 'pending',
      });
    }
    setVerified(next);
    // Sincronizar también el store para futuros renders
    if (currentMd !== markdown) {
      useCanvasStore.getState().setMarkdown(currentMd);
    }
    void verifyRefs(freshExtracted.map((c) => c.ref));
  }, [markdown, verified, verifyRefs]);

  const items = Array.from(verified.values());
  const totals = useMemo(() => {
    const t = { verified: 0, outdated: 0, pending: 0, unverifiable: 0 };
    for (const c of items) t[c.status]++;
    return t;
  }, [items]);
  const score = items.length > 0 ? Math.round((totals.verified / items.length) * 100) : null;

  return (
    <aside className="surface flex h-full min-h-0 flex-col">
      <header className="border-b border-line px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wider muted">
              Citas verificadas
            </div>
            <div className="mt-[2px] text-[11px] text-ink-3">
              {items.length === 0
                ? 'Sin citas detectadas'
                : `${items.length} cita${items.length === 1 ? '' : 's'} · ${
                    totals.verified
                  }/${items.length} verificadas`}
            </div>
          </div>
          <button
            type="button"
            onClick={handleReverifyAll}
            disabled={verifying || items.length === 0}
            className="btn btn-sm"
            title="Reverificar todas las citas"
            aria-label="Reverificar todas las citas"
          >
            <RefreshCw
              size={12}
              className={cn('flex-none', verifying && 'animate-spin')}
              aria-hidden="true"
            />
          </button>
        </div>
        {score !== null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className={cn(
                  'h-full transition-all',
                  score >= 95
                    ? 'bg-emerald-500'
                    : score >= 70
                      ? 'bg-amber-500'
                      : 'bg-red-500',
                )}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="mono text-[10.5px] muted tabular-nums">{score}%</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-auto p-3">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <CitationItem key={c.ref} c={c} />
            ))}
          </ul>
        )}
      </div>

      {lastVerifiedAt && (
        <footer className="border-t border-line px-4 py-2 text-[10.5px] muted">
          Última verificación · {new Date(lastVerifiedAt).toLocaleTimeString('es-CO')}
          {matterId ? ` · matter ${matterId.slice(0, 8)}` : ''}
        </footer>
      )}
    </aside>
  );
}

function CitationItem({ c }: { c: VerifiedCitation }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <li className="rounded-md border border-line bg-bg-elev p-2.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="mono text-[11px] font-semibold text-ink hover:underline"
          title="Ver detalle de la cita"
        >
          {c.ref}
        </button>
        <CitationBadge status={c.status} className="ml-auto" />
      </div>
      <div className="mt-1 text-[10.5px] muted">
        {citationTypeLabel(c.type)}
        {c.corte ? ` · ${c.corte}` : ''}
      </div>
      {c.rubro && (
        <div className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-ink-2">
          {c.rubro}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        {c.url && (
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
          >
            Fuente oficial
            <ExternalLink size={10} aria-hidden="true" />
          </a>
        )}
        {c.status === 'outdated' && (
          <SuggestReplacementButton citation={c} />
        )}
      </div>

      <CitationPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        citation={c}
      />
    </li>
  );
}

/** S3-05b · button shown only on outdated citations.
 *  Calls /api/citations/suggest-replacement and offers find-replace
 *  in the canvas if the user accepts the suggestion. */
function SuggestReplacementButton({ citation }: { citation: VerifiedCitation }) {
  const [busy, setBusy] = useState(false);

  const handleClick = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/citations/suggest-replacement', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          citation_ref: citation.ref,
          rubro: citation.rubro,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 160) || `Error ${res.status}`);
      }
      const data = (await res.json()) as {
        replacement_ref: string | null;
        replacement_rubro: string | null;
        replacement_url: string | null;
        reason: string;
        confidence: number;
        found: boolean;
      };
      if (!data.found || !data.replacement_ref) {
        toast.warning(data.reason);
        return;
      }
      const apply = window.confirm(
        `Sugerencia: ${data.replacement_ref}\n\n` +
          `Confianza: ${(data.confidence * 100).toFixed(0)}%\n` +
          `${data.reason}\n\n` +
          `¿Reemplazar "${citation.ref}" por "${data.replacement_ref}" en todo el documento?`,
      );
      if (!apply) return;
      const api = uiCommandBus.getCanvasApi();
      if (!api) {
        toast.error('Editor no disponible. Recarga la página.');
        return;
      }
      const { count } = api.find_replace(citation.ref, data.replacement_ref);
      toast.success(`Reemplazadas ${count} ocurrencia${count === 1 ? '' : 's'}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error sugiriendo reemplazo');
    } finally {
      setBusy(false);
    }
  }, [citation]);

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={busy}
      className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-medium text-amber-700 dark:text-amber-300"
      title="Sugerir cita vigente equivalente"
    >
      {busy ? (
        <Loader2 size={10} className="animate-spin" aria-hidden="true" />
      ) : (
        <Replace size={10} aria-hidden="true" />
      )}
      Sugerir reemplazo
    </button>
  );
}

/** S3-04 · click cita → modal con preview de la URL oficial. */
function CitationPreviewDialog({
  open,
  onOpenChange,
  citation,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  citation: VerifiedCitation;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] flex w-[min(900px,95vw)] h-[min(720px,90vh)] -translate-x-1/2 -translate-y-1/2 flex-col p-0 shadow-3 outline-none">
          <header className="flex items-center gap-3 border-b border-line p-4">
            <span className="mono text-[14px] font-semibold">{citation.ref}</span>
            <CitationBadge status={citation.status} />
            <span className="text-[11.5px] muted">
              {citationTypeLabel(citation.type)}
              {citation.corte ? ` · ${citation.corte}` : ''}
            </span>
            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-[12px] text-accent hover:underline"
              >
                Abrir en nueva pestaña
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            )}
          </header>
          <div className="flex-1 overflow-hidden">
            {citation.url ? (
              <iframe
                src={citation.url}
                className="h-full w-full border-0"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                title={`Fuente oficial · ${citation.ref}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <div className="text-[14px] font-semibold text-ink">
                    Sin fuente oficial enlazada
                  </div>
                  <p className="mt-2 text-[12.5px] muted">
                    El registry no tiene URL para esta cita aún. Verifica manualmente
                    contra los portales de la Corte Constitucional, Consejo de Estado
                    o SUIN-Juriscol.
                  </p>
                </div>
              </div>
            )}
          </div>
          {citation.rubro && (
            <footer className="border-t border-line p-3 text-[12px] leading-snug text-ink-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider muted">
                Rubro
              </span>
              <p className="mt-1">{citation.rubro}</p>
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-line p-4 text-center">
      <div className="text-[12px] font-medium text-ink-2">Sin citas detectadas</div>
      <div className="mt-1 text-[11px] muted">
        Cuando insertes referencias jurídicas (T-XXX/AAAA, Ley X de YYYY, etc.) aparecerán
        aquí con su estado de vigencia verificado contra fuentes oficiales.
      </div>
    </div>
  );
}
