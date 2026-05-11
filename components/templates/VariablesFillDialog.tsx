'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Variable } from 'lucide-react';
import {
  extractVariables,
  humanizeVariableName,
  substituteVariables,
} from '@/lib/templates/variables';

/**
 * Modal that asks the user to fill the template's `{{variables}}` before
 * inserting the result into the canvas.
 *
 * Stateless w.r.t. the template content: the parent owns the markdown
 * and gets the substituted markdown back via `onConfirm`.
 */
export function VariablesFillDialog({
  open,
  onOpenChange,
  templateName,
  templateContent,
  initialValues,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templateName: string;
  templateContent: string;
  initialValues?: Record<string, string>;
  onConfirm: (substitutedMd: string, values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(initialValues ?? {});

  useEffect(() => {
    if (open) setValues(initialValues ?? {});
  }, [open, initialValues]);

  const variables = extractVariables(templateContent);

  const handleConfirm = () => {
    const md = substituteVariables(templateContent, values);
    onConfirm(md, values);
    onOpenChange(false);
  };

  // If template has no variables, auto-confirm without showing the dialog.
  useEffect(() => {
    if (open && variables.length === 0) {
      onConfirm(templateContent, {});
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (variables.length === 0) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="surface fixed left-1/2 top-1/2 z-[91] w-[min(560px,92vw)] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-auto p-6 shadow-3 outline-none">
          <Dialog.Title className="serif flex items-center gap-2 text-[18px] font-semibold">
            <Variable size={16} aria-hidden="true" />
            Llenar variables · {templateName}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-[12.5px] muted">
            Esta plantilla contiene {variables.length} variable
            {variables.length === 1 ? '' : 's'}. Lo que escribas aquí se inserta en el
            canvas. Variables vacías se conservan como <code className="mono">{'{{nombre}}'}</code>.
          </Dialog.Description>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="mt-4 grid gap-3"
          >
            {variables.map((v) => (
              <label key={v} className="block">
                <span className="text-[11.5px] font-medium muted">
                  {humanizeVariableName(v)}
                  <span className="mono ml-2 text-[10.5px] text-ink-3">{`{{${v}}}`}</span>
                </span>
                <input
                  type="text"
                  value={values[v] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [v]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-line bg-bg-elev px-3 py-2 text-[13px] outline-none focus:border-accent"
                  autoFocus={v === variables[0]}
                />
              </label>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary ml-auto">
                Insertar en canvas
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
