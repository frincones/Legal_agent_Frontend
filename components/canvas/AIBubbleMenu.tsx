'use client';

import { BubbleMenu, type Editor } from '@tiptap/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Sprint 3.F · Bubble menu inline al seleccionar texto
 *
 * Cuando el abogado selecciona texto en el editor aparece este menú flotante
 * con acciones IA: Mejorar, Hacer formal, Resumir, Citar jurisprudencia.
 *
 * Cada acción llama a /api/canvas/transform con la selección y reemplaza
 * el texto por el resultado. Antes de aplicar, marca el cambio con highlight
 * durante 6s para que el abogado pueda revisar y, si quiere, deshacer (Ctrl+Z).
 */

type Action = 'improve' | 'formalize' | 'summarize' | 'cite' | 'atacar';

const ACTIONS: Array<{ key: Action; label: string; icon: string; description: string }> = [
  { key: 'improve', label: 'Mejorar', icon: '✨', description: 'Reescribe con tono profesional' },
  { key: 'formalize', label: 'Formal', icon: '🎓', description: 'Lenguaje jurídico técnico' },
  { key: 'summarize', label: 'Resumir', icon: '📝', description: 'Condensa en 1-2 oraciones' },
  { key: 'cite', label: 'Citar', icon: '⚖️', description: 'Añade jurisprudencia relacionada' },
  { key: 'atacar', label: 'Atacar', icon: '🛡️', description: 'Refuta este argumento de la contraparte' },
];

export function AIBubbleMenu({ editor }: { editor: Editor }) {
  const [busy, setBusy] = useState<Action | null>(null);

  async function applyTransform(action: Action) {
    if (busy) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, '\n');
    if (!text || text.length < 4) {
      toast.warning('Selecciona texto primero (mínimo 4 caracteres).');
      return;
    }
    if (text.length > 8_000) {
      toast.warning('Selección muy larga. Máximo 8000 caracteres.');
      return;
    }
    setBusy(action);
    try {
      const res = await fetch('/api/canvas/transform', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { markdown?: string; error?: string };
      if (data.error || !data.markdown) throw new Error(data.error ?? 'Sin respuesta');

      // `atacar` inserta el contra-argumento DESPUÉS de la selección
      // (no reemplaza el argumento de la contraparte). El resto de
      // acciones reemplazan in-place.
      if (action === 'atacar') {
        appendAfter(editor, to, data.markdown);
      } else {
        applyWithReview(editor, from, to, data.markdown, action);
      }
      toast.success(`${ACTIONS.find((a) => a.key === action)!.label} aplicado · Ctrl+Z para deshacer`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al aplicar transformación');
    } finally {
      setBusy(null);
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: 'top', maxWidth: 'none' }}
      shouldShow={({ from, to }) => to - from > 3 && !editor.isActive('codeBlock')}
    >
      <div className="flex items-center gap-1 rounded-lg border border-line bg-bg p-1 shadow-xl">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            disabled={busy !== null}
            onClick={() => void applyTransform(a.key)}
            title={a.description}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] transition',
              'hover:bg-accent-soft disabled:opacity-50 disabled:cursor-wait',
              busy === a.key && 'bg-accent-soft animate-pulse',
            )}
          >
            <span className="text-[13px] leading-none">{a.icon}</span>
            <span className="font-medium">{a.label}</span>
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-line" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Resaltar pasaje"
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] transition hover:bg-bg-sunken',
            editor.isActive('highlight') && 'bg-warn-soft',
          )}
        >
          🖍️
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrita"
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-bold transition hover:bg-bg-sunken',
            editor.isActive('bold') && 'bg-accent-soft',
          )}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Cursiva"
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md text-[12px] italic transition hover:bg-bg-sunken',
            editor.isActive('italic') && 'bg-accent-soft',
          )}
        >
          I
        </button>
      </div>
    </BubbleMenu>
  );
}

/**
 * Sprint 4.G · Pattern accept/reject simplificado
 *
 * En vez de un diff inline complejo, aplicamos el cambio inmediatamente con
 * un highlight warn-soft. El undo de TipTap es atómico, así que Ctrl+Z
 * deshace el cambio entero. Tras 6s el highlight desaparece automáticamente.
 */
function applyWithReview(
  editor: Editor,
  from: number,
  to: number,
  markdown: string,
  _action: Action,
) {
  const storage = (editor.storage as Record<string, unknown>).markdown as
    | { parser?: { parse: (s: string) => string } }
    | undefined;
  const html = storage?.parser?.parse?.(markdown) ?? markdown;

  // Aplicar reemplazo
  editor
    .chain()
    .focus()
    .deleteRange({ from, to })
    .insertContentAt(from, html)
    .run();

  // Marcar el rango nuevo con highlight para review (6s)
  const newTo = editor.state.selection.from;
  if (newTo > from) {
    editor.chain().setTextSelection({ from, to: newTo }).setHighlight().run();
    setTimeout(() => {
      try {
        editor.chain().setTextSelection({ from, to: newTo }).unsetHighlight().run();
      } catch {
        // Document may have changed; ignore.
      }
    }, 6_000);
  }
}

/** S3-02 · used by the 'atacar' action: inserts a new block after the
 *  selected paragraph instead of replacing it. */
function appendAfter(editor: Editor, to: number, markdown: string) {
  const storage = (editor.storage as Record<string, unknown>).markdown as
    | { parser?: { parse: (s: string) => string } }
    | undefined;
  const html = storage?.parser?.parse?.(`\n\n${markdown}\n\n`) ?? markdown;
  editor.chain().focus().insertContentAt(to, html).run();
  const newTo = editor.state.selection.from;
  if (newTo > to) {
    editor.chain().setTextSelection({ from: to, to: newTo }).setHighlight().run();
    setTimeout(() => {
      try {
        editor.chain().setTextSelection({ from: to, to: newTo }).unsetHighlight().run();
      } catch {}
    }, 6_000);
  }
}
