'use client';

import { useCallback, useState } from 'react';
import { Sparkles, Scale, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';

/**
 * Top-bar action buttons for whole-document AI operations:
 *
 * - Suma         → genera el encabezado/proemio del escrito y lo
 *                  inserta al inicio del canvas (TASK-S0-06).
 * - Fundamentar  → genera SOLO la sección de fundamentación de
 *                  derecho con citas verificables y la añade al final
 *                  del canvas (TASK-S0-05, insight I-15).
 *
 * Both buttons hit /api/canvas/transform (Railway proxy → backend
 * canvas_transform.py extended in this sprint).
 */

type AIAction = 'suma' | 'fundamentar';

const COPY: Record<AIAction, { label: string; tooltip: string; busy: string; toastOk: string }> = {
  suma: {
    label: 'Generar Suma',
    tooltip: 'Inserta el encabezado/proemio al inicio del documento',
    busy: 'Generando suma…',
    toastOk: 'Suma insertada al inicio',
  },
  fundamentar: {
    label: 'Fundamentar',
    tooltip: 'Genera la sección de fundamentación de derecho con citas verificables',
    busy: 'Generando fundamentación…',
    toastOk: 'Fundamentación añadida al final',
  },
};

export function CanvasAIActions() {
  const [busy, setBusy] = useState<AIAction | null>(null);

  const run = useCallback(async (action: AIAction) => {
    if (busy) return;
    const canvas = uiCommandBus.getCanvasApi();
    if (!canvas) {
      toast.error('Canvas no disponible. Recarga la página.');
      return;
    }
    const current = canvas.get_current();
    if (action === 'fundamentar' && current.markdown.trim().length < 40) {
      toast.warning(
        'Escribe primero los hechos y pretensiones del caso para que la IA pueda fundamentar.',
      );
      return;
    }
    setBusy(action);
    const t = toast.loading(COPY[action].busy);
    try {
      const res = await fetch('/api/canvas/transform', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          text: current.markdown || '(documento vacío)',
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Error ${res.status}: ${errText.slice(0, 160)}`);
      }
      const data = (await res.json()) as { markdown?: string };
      const insert = (data.markdown ?? '').trim();
      if (!insert) throw new Error('La IA no devolvió contenido');

      if (action === 'suma') {
        // Insert at the top: prepend to current document.
        canvas.set_text(`${insert}\n\n${current.markdown}`);
      } else {
        // Fundamentar: append at the end with a blank line separator.
        canvas.append(`\n\n${insert}\n`);
      }
      toast.dismiss(t);
      toast.success(COPY[action].toastOk);
    } catch (e) {
      toast.dismiss(t);
      const msg = e instanceof Error ? e.message : 'Error generando contenido';
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }, [busy]);

  return (
    <>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => void run('suma')}
        disabled={busy !== null}
        aria-label={COPY.suma.label}
        title={COPY.suma.tooltip}
      >
        {busy === 'suma' ? (
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles size={12} aria-hidden="true" />
        )}
        {COPY.suma.label}
      </button>
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => void run('fundamentar')}
        disabled={busy !== null}
        aria-label={COPY.fundamentar.label}
        title={COPY.fundamentar.tooltip}
      >
        {busy === 'fundamentar' ? (
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
        ) : (
          <Scale size={12} aria-hidden="true" />
        )}
        {COPY.fundamentar.label}
      </button>
    </>
  );
}
