'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FilledResult = {
  filled: Record<string, unknown>;
  missing: string[];
  variables_requested: string[];
};

/**
 * Sprint 19 · Botón "Auto-rellenar con IA" reusable.
 *
 * Recibe:
 *  - `templateBody` con variables `{{var}}` que se quieren rellenar
 *  - `matterId` para tomar el contexto del caso
 *  - `onAccept(filledMap)` cuando el usuario aprueba los valores
 *
 * Internamente:
 *  - llama /api/template-ai/autofill-from-matter
 *  - muestra una preview side-by-side editable
 *  - al "Aplicar" devuelve el mapa final al padre
 */
export function SmartFillButton({
  templateBody,
  matterId,
  extraText,
  buttonLabel = 'Auto-rellenar con IA',
  variant = 'primary',
  onAccept,
  className,
}: {
  templateBody: string;
  matterId: string | null | undefined;
  extraText?: string;
  buttonLabel?: string;
  variant?: 'primary' | 'ghost';
  onAccept: (values: Record<string, unknown>) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FilledResult | null>(null);
  const [edited, setEdited] = useState<Record<string, unknown>>({});

  async function run() {
    if (!matterId) {
      toast.error('Necesito un caso para tomar el contexto');
      return;
    }
    setOpen(true);
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch('/api/template-ai/autofill-from-matter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          matter_id: matterId,
          template_body: templateBody,
          extra_text: extraText,
        }),
      });
      if (r.ok) {
        const data: FilledResult = await r.json();
        setResult(data);
        setEdited({ ...(data.filled || {}) });
      } else {
        const e = await r.json().catch(() => ({}));
        toast.error(e.detail || 'No se pudo auto-rellenar');
        setOpen(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error de red');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    onAccept(edited);
    setOpen(false);
    setResult(null);
    setEdited({});
    toast.success('Variables aplicadas al template');
  }

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={!templateBody || !matterId}
        className={cn(
          variant === 'primary' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm',
          className,
        )}
        title={!matterId ? 'Necesitas un caso seleccionado' : 'IA rellena las variables {{...}}'}
      >
        <Wand2 size={14} />
        {buttonLabel}
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-bg-overlay backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-[8%] z-50 w-[min(96vw,640px)] -translate-x-1/2 rounded-xl border border-line bg-bg shadow-2 outline-none max-h-[84vh] overflow-y-auto">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h3 className="serif inline-flex items-center gap-1.5 text-[14.5px] font-semibold">
                <Sparkles size={14} className="text-accent" /> Auto-rellenar con IA
              </h3>
              <Dialog.Close className="btn btn-icon btn-ghost btn-sm" aria-label="Cerrar">
                <X size={14} />
              </Dialog.Close>
            </header>

            <div className="p-4">
              {loading ? (
                <div className="py-10 text-center text-[12.5px] muted">
                  <Loader2 className="mx-auto animate-spin" size={20} />
                  <div className="mt-2">Analizando contexto del caso…</div>
                </div>
              ) : result ? (
                <div className="grid gap-3">
                  <p className="text-[12px] muted">
                    Revisa los valores. Puedes editar antes de aplicar. Las variables que
                    la IA no pudo determinar aparecen vacías.
                  </p>
                  {result.variables_requested.length === 0 ? (
                    <div className="rounded-md border border-dashed border-line p-4 text-center text-[12.5px] muted">
                      El template no tiene variables <code>{'{{ ... }}'}</code> para rellenar.
                    </div>
                  ) : (
                    <ul className="grid gap-2">
                      {result.variables_requested.map((name) => {
                        const v = edited[name];
                        const isMissing = result.missing.includes(name);
                        return (
                          <li key={name} className={cn(
                            'rounded-md border px-3 py-2',
                            isMissing ? 'border-warn bg-warn-soft' : 'border-line bg-bg-elev',
                          )}>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="mono text-[11px] text-ink-3">{`{{${name}}}`}</span>
                              {isMissing && (
                                <span className="chip chip-warning text-[10px]">IA no encontró valor</span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={String(v ?? '')}
                              onChange={(ev) => setEdited((p) => ({ ...p, [name]: ev.target.value }))}
                              placeholder={isMissing ? 'Llenar manualmente…' : ''}
                              className="input w-full text-[13px]"
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
              <span className="text-[11px] muted">
                {result ? `${result.variables_requested.length - result.missing.length}/${result.variables_requested.length} variables completas` : ''}
              </span>
              <div className="flex items-center gap-2">
                <Dialog.Close className="btn btn-ghost btn-sm">Cancelar</Dialog.Close>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={apply}
                  disabled={!result || result.variables_requested.length === 0}
                >
                  Aplicar al template
                </button>
              </div>
            </footer>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
