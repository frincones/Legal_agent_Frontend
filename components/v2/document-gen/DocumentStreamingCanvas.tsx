'use client';

/**
 * components/v2/document-gen/DocumentStreamingCanvas.tsx
 *
 * Wrapper master del flow de generacion de documentos en streaming.
 * Orquesta todos los componentes:
 *  - TableOfContents (sticky izq)
 *  - SectionBlock x N (centro, papel)
 *  - QualityScorecard (drcha o footer)
 *  - DocumentExportMenu (toolbar)
 *  - CheckpointBadge (footer flotante)
 *  - SectionDiff (modal cuando hay diff pendiente)
 *
 * Estados maneja:
 *  - sectionPositions: scroll a sección via TOC
 *  - lockedSections: Set<string>
 *  - userEditedSections: Set<string>
 *  - pendingDiff: { sectionKey, originalMd, newMd } | null
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useDocumentGenStream, type SectionState } from '@/lib/v2/document-gen/useDocumentGenStream';
import { checkpointManager, type Checkpoint } from '@/lib/v2/document-gen/checkpointManager';
import { SectionBlock, type SectionStatus } from './SectionBlock';
import { TableOfContents } from './TableOfContents';
import { StreamingProgressBar } from './StreamingProgressBar';
import { QualityScorecard } from './QualityScorecard';
import { DocumentExportMenu } from './DocumentExportMenu';
import { CheckpointBadge } from './CheckpointBadge';
import { SectionDiff } from './SectionDiff';

export interface DocumentStreamingCanvasProps {
  /** Intent inicial del usuario (texto libre). */
  intent: string;
  /** Brief detallado del caso (opcional, viene de form). */
  userBrief?: string;
  /** ID del matter si esta vinculado a un caso. */
  matterId?: string | null;
  /** Materia opcional (clasificacion previa). */
  materia?: string | null;
  /** Doc type opcional (clasificacion previa). */
  docType?: string | null;
  /** Callback cuando el documento se genera completo. */
  onComplete?: (matterDocumentId: string) => void;
}

export function DocumentStreamingCanvas({
  intent,
  userBrief,
  matterId,
  materia,
  docType,
  onComplete,
}: DocumentStreamingCanvasProps) {
  const { state, start, abort } = useDocumentGenStream();
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());
  const [userEditedSections, setUserEditedSections] = useState<Set<string>>(new Set());
  const [pendingDiff, setPendingDiff] = useState<{ sectionKey: string; originalMd: string; newMd: string } | null>(null);
  const startedRef = useRef(false);

  // Auto-start en mount (una sola vez)
  useEffect(() => {
    if (startedRef.current || !intent.trim()) return;
    startedRef.current = true;
    void start({
      intent,
      user_brief: userBrief ?? intent,
      matter_id: matterId ?? null,
      materia: materia ?? null,
      doc_type: docType ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Notificar al padre cuando se completa
  useEffect(() => {
    if (state.status === 'done' && state.matterDocumentId && onComplete) {
      onComplete(state.matterDocumentId);
    }
  }, [state.status, state.matterDocumentId, onComplete]);

  // Keyboard shortcut Cmd+L: lock toggle de seccion activa
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'l' && state.currentSectionKey) {
        e.preventDefault();
        toggleLock(state.currentSectionKey);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentSectionKey]);

  // Calcular estado visual de cada seccion
  const getSectionStatus = useCallback(
    (sectionKey: string, sectionState: SectionState | undefined): SectionStatus => {
      if (lockedSections.has(sectionKey)) return 'locked';
      if (!sectionState) return 'pending';
      if (sectionState.status === 'error') return 'error';
      if (sectionState.status === 'streaming') return 'streaming';
      if (sectionState.status === 'done') {
        // Si tiene critic_score y tiene citations verificadas, marcar verified
        if (
          sectionState.critic_score != null &&
          sectionState.critic_score >= 0.8 &&
          state.citationRate != null &&
          state.citationRate >= 0.9
        ) {
          return 'verified';
        }
        return 'done';
      }
      return 'pending';
    },
    [lockedSections, state.citationRate],
  );

  const toggleLock = useCallback((sectionKey: string) => {
    setLockedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
        toast(`Sección desbloqueada`);
      } else {
        next.add(sectionKey);
        toast(`Sección protegida del agente`);
      }
      return next;
    });
  }, []);

  const handleSectionClick = useCallback((sectionKey: string) => {
    const el = document.getElementById(`section-${sectionKey}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleRegenerate = useCallback(
    async (sectionKey: string) => {
      if (!state.generationId) return;
      // Crear checkpoint antes de regenerar
      const section = state.sections[sectionKey];
      if (section) {
        checkpointManager.save(
          state.generationId,
          { sectionKey, contentMd: section.content_md },
          'pre_regenerate',
        );
        window.dispatchEvent(new CustomEvent('lexai:checkpoint-saved'));
      }

      try {
        const res = await fetch(`/api/documents/${state.generationId}/regenerate-section`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ section_key: sectionKey }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success(`Regenerando ${section?.section_title ?? sectionKey}...`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Error regenerando: ${msg}`);
      }
    },
    [state.generationId, state.sections],
  );

  const handleEdit = useCallback((sectionKey: string) => {
    setUserEditedSections((prev) => new Set(prev).add(sectionKey));
    toast.info('Modo edición manual (placeholder — TipTap inline editing pendiente)');
  }, []);

  const handleDelete = useCallback((sectionKey: string) => {
    if (!confirm(`¿Eliminar sección "${state.sections[sectionKey]?.section_title ?? sectionKey}"?`)) return;
    // TODO: implementar delete en backend
    toast.info('Eliminar sección (pendiente backend)');
  }, [state.sections]);

  const handleRestore = useCallback((checkpoint: Checkpoint) => {
    // TODO: aplicar checkpoint al estado del documento
    toast.success(`Restaurado checkpoint de hace ${Math.floor((Date.now() - checkpoint.timestamp) / 1000)}s`);
  }, []);

  const handleRate = useCallback(
    async (rating: number) => {
      if (!state.matterDocumentId) return;
      try {
        const res = await fetch(`/api/documents/${state.matterDocumentId}/rate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ rating }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success(`Gracias por tu calificación (${rating}/5)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Error al calificar: ${msg}`);
      }
    },
    [state.matterDocumentId],
  );

  // Construir markdown completo del documento (para export)
  const fullDocumentMd = state.sectionsPlan
    .map((s) => state.sections[s.key]?.content_md ?? '')
    .filter(Boolean)
    .join('\n\n');

  const sortedSections = [...state.sectionsPlan].sort((a, b) => {
    const aOrder = state.sections[a.key]?.section_order ?? 999;
    const bOrder = state.sections[b.key]?.section_order ?? 999;
    return aOrder - bOrder;
  });

  const completedCount = sortedSections.filter((s) => state.sections[s.key]?.status === 'done').length;
  const showScorecard = state.status === 'done' || state.status === 'scoring';

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--v2-bg-cream,#FDFCF8)]">
      {/* Header toolbar */}
      <div
        className="shrink-0 border-b px-4 py-3"
        style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-[16px] font-semibold"
              style={{
                fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)',
                color: 'var(--v2-text-primary, #1A1916)',
              }}
            >
              {state.templateSelected?.name ?? 'Generando documento...'}
            </h2>
            {state.templateSelected && (
              <div className="mt-0.5 text-[11px] text-[var(--v2-text-tertiary,#807E76)]">
                Plantilla seleccionada · Calidad{' '}
                <span className="font-medium tabular-nums">{(state.templateSelected.quality_score * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
          {state.matterDocumentId && (
            <DocumentExportMenu
              documentId={state.matterDocumentId}
              documentTitle={state.templateSelected?.name}
              documentMd={fullDocumentMd}
            />
          )}
        </div>
      </div>

      {/* Progress bar (siempre visible mientras genera) */}
      {state.status !== 'idle' && state.status !== 'done' && (
        <div className="shrink-0 px-4 pt-3">
          <div className="mx-auto max-w-6xl">
            <StreamingProgressBar
              currentSection={completedCount}
              totalSections={state.sectionsPlan.length}
              currentSectionTitle={
                state.currentSectionKey ? state.sections[state.currentSectionKey]?.section_title ?? null : null
              }
              status={state.status === 'starting' ? 'planning' : state.status}
              onAbort={state.status === 'streaming' ? abort : undefined}
            />
          </div>
        </div>
      )}

      {/* Main: TOC + canvas + scorecard */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_280px]">
          {/* TOC izquierda (lg+) */}
          <div className="hidden lg:block">
            {state.sectionsPlan.length > 0 && (
              <TableOfContents
                sectionsPlan={state.sectionsPlan}
                sections={state.sections}
                activeSectionKey={state.currentSectionKey}
                onSectionClick={handleSectionClick}
              />
            )}
          </div>

          {/* Canvas central — hoja de papel */}
          <div
            className="rounded-lg border bg-white p-6 shadow-sm"
            style={{ borderColor: 'var(--v2-border-default, #D4D2CA)', minHeight: 600 }}
          >
            {state.status === 'idle' || state.status === 'starting' || state.status === 'planning' ? (
              <div className="flex h-full items-center justify-center text-[13px] text-[var(--v2-text-tertiary,#807E76)]">
                Preparando documento...
              </div>
            ) : sortedSections.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[13px] text-[var(--v2-text-tertiary,#807E76)]">
                Esperando plan de secciones...
              </div>
            ) : (
              <div className="space-y-5">
                {sortedSections.map((planEntry) => {
                  const sectionState = state.sections[planEntry.key];
                  const status = getSectionStatus(planEntry.key, sectionState);
                  return (
                    <SectionBlock
                      key={planEntry.key}
                      sectionKey={planEntry.key}
                      sectionTitle={sectionState?.section_title ?? planEntry.title}
                      sectionOrder={sectionState?.section_order ?? 0}
                      status={status}
                      contentMd={sectionState?.content_md ?? ''}
                      criticScore={sectionState?.critic_score}
                      citationCount={sectionState?.citation_refs?.length}
                      isUserEdited={userEditedSections.has(planEntry.key)}
                      isLocked={lockedSections.has(planEntry.key)}
                      onRegenerate={handleRegenerate}
                      onEdit={handleEdit}
                      onToggleLock={toggleLock}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Scorecard derecha (xl+, una vez completo) */}
          {showScorecard && (
            <div className="hidden xl:block">
              <div className="sticky top-2">
                <QualityScorecard
                  qualityScore={state.qualityScore}
                  citations={state.citations}
                  citationRate={state.citationRate}
                  totalSections={state.sectionsPlan.length}
                  completedSections={completedCount}
                  onExport={() => {
                    /* DocumentExportMenu ya esta en toolbar */
                  }}
                  onRate={handleRate}
                />
              </div>
            </div>
          )}
        </div>

        {/* Scorecard en breakpoints chicos: abajo del canvas */}
        {showScorecard && (
          <div className="mx-auto mt-5 max-w-6xl xl:hidden">
            <QualityScorecard
              qualityScore={state.qualityScore}
              citations={state.citations}
              citationRate={state.citationRate}
              totalSections={state.sectionsPlan.length}
              completedSections={completedCount}
              onRate={handleRate}
            />
          </div>
        )}
      </div>

      {/* Checkpoint badge flotante */}
      {state.generationId && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-40">
          <div className="pointer-events-auto">
            <CheckpointBadge docId={state.generationId} onRestore={handleRestore} />
          </div>
        </div>
      )}

      {/* Diff modal flotante */}
      {pendingDiff && (
        <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-3xl p-4">
          <SectionDiff
            sectionTitle={state.sections[pendingDiff.sectionKey]?.section_title ?? pendingDiff.sectionKey}
            originalMd={pendingDiff.originalMd}
            newMd={pendingDiff.newMd}
            onAccept={() => {
              setPendingDiff(null);
              toast.success('Cambios aceptados');
            }}
            onRevert={() => {
              setPendingDiff(null);
              toast.info('Cambios revertidos');
            }}
          />
        </div>
      )}

      {/* Error state */}
      {state.status === 'error' && state.error && (
        <div className="shrink-0 border-t bg-red-50 px-4 py-3" style={{ borderColor: 'rgb(254, 202, 202)' }}>
          <div className="mx-auto max-w-6xl text-[12px] text-red-800">
            <strong>Error en generación:</strong> {state.error}
          </div>
        </div>
      )}
    </div>
  );
}
