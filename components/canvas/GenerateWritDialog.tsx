'use client';

import { useCallback, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Sparkles, Square } from 'lucide-react';
import { toast } from 'sonner';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';
import { useCanvasStore } from '@/lib/stores/canvas-store';

/**
 * S3-01c · Streaming writ generation entry point.
 *
 * Opens a dialog where the lawyer specifies doc_type + facts + pretensions,
 * then hits POST /api/canvas/generate (NDJSON stream). As tokens arrive,
 * we append them to the canvas via uiCommandBus.canvasApi. Detected
 * citations are pushed to the citations sidebar via the canvas store
 * (the sidebar's debounced extractor will pick them up in the next pass).
 */

type DocType =
  | 'tutela'
  | 'contestacion'
  | 'demanda_laboral'
  | 'derecho_peticion'
  | 'recurso_apelacion'
  | 'casacion'
  | 'dictamen'
  | 'otro';

const DOC_TYPES: Array<{ id: DocType; label: string }> = [
  { id: 'tutela', label: 'Acción de tutela' },
  { id: 'contestacion', label: 'Contestación de demanda' },
  { id: 'demanda_laboral', label: 'Demanda laboral' },
  { id: 'derecho_peticion', label: 'Derecho de petición' },
  { id: 'recurso_apelacion', label: 'Recurso de apelación' },
  { id: 'casacion', label: 'Recurso de casación' },
  { id: 'dictamen', label: 'Dictamen / opinión legal' },
  { id: 'otro', label: 'Otro escrito' },
];

export function GenerateWritDialog({
  matterId,
  trigger,
}: {
  matterId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<DocType>('tutela');
  const [facts, setFacts] = useState('');
  const [pretensions, setPretensions] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [progressChars, setProgressChars] = useState(0);
  const [detectedCitations, setDetectedCitations] = useState<string[]>([]);
  const abortRef = useState<AbortController | null>(null)[0];

  const reset = useCallback(() => {
    setProgressChars(0);
    setDetectedCitations([]);
  }, []);

  const handleStart = useCallback(async () => {
    if (facts.trim().length < 10) {
      toast.warning('Describe los hechos del caso (mínimo 10 caracteres).');
      return;
    }
    const api = uiCommandBus.getCanvasApi();
    if (!api) {
      toast.error('Editor no disponible. Recarga la página.');
      return;
    }
    const current = api.get_current();
    if (current.markdown.trim().length > 0) {
      const ok = window.confirm(
        'El canvas tiene contenido. ¿Reemplazarlo con el escrito generado?\n\n' +
          '(Cancela para insertar al final del documento actual.)',
      );
      // If user cancels, append; if accepts, replace.
      if (ok) api.set_text('');
    }

    setStreaming(true);
    reset();
    const controller = new AbortController();
    try {
      const res = await fetch('/api/canvas/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          matter_id: matterId,
          doc_type: docType,
          facts: facts.trim(),
          pretensions: pretensions.trim() || undefined,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(text.slice(0, 200) || `Error ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let totalChars = 0;
      const cites = new Set<string>();
      // Buffer markdown deltas to push to TipTap less often (every ~80 chars).
      let pendingDelta = '';
      let lastFlush = Date.now();
      const FLUSH_EVERY_MS = 250;

      const flush = () => {
        if (pendingDelta) {
          api.append(pendingDelta);
          pendingDelta = '';
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl = buffer.indexOf('\n');
        while (nl >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          nl = buffer.indexOf('\n');
          if (!line) continue;
          try {
            const ev = JSON.parse(line) as {
              type: string;
              delta?: string;
              ref?: string;
              message?: string;
            };
            if (ev.type === 'text' && ev.delta) {
              pendingDelta += ev.delta;
              totalChars += ev.delta.length;
              setProgressChars(totalChars);
              if (Date.now() - lastFlush >= FLUSH_EVERY_MS) {
                flush();
                lastFlush = Date.now();
              }
            } else if (ev.type === 'citation_detected' && ev.ref) {
              cites.add(ev.ref);
              setDetectedCitations(Array.from(cites));
            } else if (ev.type === 'error') {
              throw new Error(ev.message ?? 'Error en generación');
            } else if (ev.type === 'done') {
              flush();
              // Force the canvas store to re-extract from the editor's current text.
              useCanvasStore.getState().setMarkdown(api.get_current().markdown);
            }
          } catch (e) {
            console.warn('[generate] bad event:', line, e);
          }
        }
      }
      flush();
      // Final sync to make the citations sidebar pick up everything.
      useCanvasStore.getState().setMarkdown(api.get_current().markdown);
      toast.success(`Escrito generado · ${totalChars} chars · ${cites.size} citas detectadas`);
      setOpen(false);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      toast.error(e instanceof Error ? e.message : 'Error generando escrito');
    } finally {
      setStreaming(false);
    }
  }, [matterId, docType, facts, pretensions, reset]);

  const handleStop = useCallback(() => {
    abortRef?.abort();
    setStreaming(false);
  }, [abortRef]);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (streaming ? null : setOpen(o))}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 p-6 shadow-3 outline-none">
          <Dialog.Title className="serif text-[18px] font-semibold">
            Generar escrito completo
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-[12.5px] muted">
            La IA redacta el escrito en streaming sobre el canvas. Las citas detectadas
            aparecen en el sidebar derecho para que las verifiques.
          </Dialog.Description>

          <div className="mt-4 grid gap-3">
            <label className="block">
              <span className="text-[11.5px] font-medium muted">Tipo de escrito</span>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocType)}
                disabled={streaming}
                className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11.5px] font-medium muted">
                Hechos del caso *
              </span>
              <textarea
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                disabled={streaming}
                rows={5}
                maxLength={8000}
                className="mt-1 w-full resize-y rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
                placeholder="Describe los hechos relevantes en orden cronológico. Incluye partes, fechas, montos, conducta del adversario."
              />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-medium muted">
                Pretensiones (opcional)
              </span>
              <textarea
                value={pretensions}
                onChange={(e) => setPretensions(e.target.value)}
                disabled={streaming}
                rows={3}
                maxLength={2000}
                className="mt-1 w-full resize-y rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
                placeholder="Qué se solicita al juzgado. Si lo omites, la IA propone pretensiones estándar para el tipo de escrito."
              />
            </label>
          </div>

          {streaming && (
            <div className="mt-4 rounded-md border border-line bg-bg-sunken p-3 text-[12px]">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-accent" aria-hidden="true" />
                Generando…
                <span className="ml-auto mono text-[11px] muted tabular-nums">
                  {progressChars} chars · {detectedCitations.length} citas
                </span>
              </div>
              {detectedCitations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {detectedCitations.map((c) => (
                    <span key={c} className="mono rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px]">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={streaming}>
              Cancelar
            </button>
            {streaming ? (
              <button
                type="button"
                className="btn btn-primary ml-auto"
                onClick={handleStop}
              >
                <Square size={12} aria-hidden="true" />
                Detener
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary ml-auto"
                onClick={() => void handleStart()}
                disabled={facts.trim().length < 10}
              >
                <Sparkles size={12} aria-hidden="true" />
                Generar escrito
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
