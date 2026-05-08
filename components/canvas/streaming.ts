'use client';

import type { Editor } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Sprint 2 · Pseudo-streaming + AI cursor decoration
 *
 * Estrategia: el agente devuelve el markdown completo, pero el editor lo
 * aplica en trozos progresivos para dar la sensación de dictado en vivo.
 * Mientras el agente "escribe", una decoración (widget ProseMirror) muestra
 * un cursor lila parpadeante con label "LexAI" en la posición actual.
 *
 * Esto NO es streaming verdadero desde OpenAI Realtime — para eso haría falta
 * cambiar el bridge WS para que envíe `_ui_command` parciales mientras el tool
 * todavía corre. Pero el efecto visual es indistinguible para chunks pequeños.
 */

const aiCursorKey = new PluginKey<DecorationSet>('lexai-ai-cursor');

/** Plugin que renderiza el cursor del agente cuando hay una posición activa. */
export function AICursorPlugin() {
  return new Plugin({
    key: aiCursorKey,
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, old) => {
        const meta = tr.getMeta(aiCursorKey);
        if (meta && typeof meta.pos === 'number') {
          const widget = document.createElement('span');
          widget.className = 'lexai-ai-cursor';
          widget.setAttribute('aria-hidden', 'true');
          widget.innerHTML = '<span class="lexai-ai-cursor-bar"></span><span class="lexai-ai-cursor-label">LexAI</span>';
          return DecorationSet.create(tr.doc, [
            Decoration.widget(meta.pos, widget, { side: 1, ignoreSelection: true }),
          ]);
        }
        if (meta && meta.clear) return DecorationSet.empty;
        return old.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return aiCursorKey.getState(state);
      },
    },
  });
}

/** Mueve el cursor del agente a una posición del documento. */
export function setAiCursor(editor: Editor, pos: number) {
  const tr = editor.state.tr.setMeta(aiCursorKey, { pos });
  editor.view.dispatch(tr);
}

/** Borra el cursor del agente. */
export function clearAiCursor(editor: Editor) {
  const tr = editor.state.tr.setMeta(aiCursorKey, { clear: true });
  editor.view.dispatch(tr);
}

/**
 * Aplica HTML al editor en chunks progresivos para simular dictado.
 *
 * @param editor    instancia TipTap
 * @param html      HTML completo a aplicar (ya parseado de markdown)
 * @param mode      'replace' = reemplaza todo el doc · 'insert' = inserta en cursor · 'append' = al final
 * @param chunkChars tamaño de cada chunk en caracteres (default 80)
 * @param delayMs   delay entre chunks (default 25ms · sensación de dictado fluido)
 */
export async function applyHtmlStreaming(
  editor: Editor,
  html: string,
  mode: 'replace' | 'insert' | 'append',
  chunkChars = 80,
  delayMs = 25,
): Promise<void> {
  if (!html) return;

  // Si es muy corto (<200 chars) o el documento es enorme, aplicar de golpe.
  if (html.length < 200) {
    if (mode === 'replace') editor.commands.setContent(html);
    else if (mode === 'insert') editor.chain().focus().insertContent(html).run();
    else editor.chain().focus('end').insertContent(html).run();
    return;
  }

  // Trocear por límites "seguros" (preferir cerrar tags, evitar partir en medio).
  const chunks = chunkHtml(html, chunkChars);

  // Setup posición inicial
  if (mode === 'replace') {
    editor.commands.setContent('');
    editor.commands.focus('end');
  } else if (mode === 'append') {
    editor.commands.focus('end');
  } else {
    editor.commands.focus();
  }

  for (const chunk of chunks) {
    if (!chunk) continue;
    editor.commands.insertContent(chunk);
    setAiCursor(editor, editor.state.selection.from);
    await sleep(delayMs);
  }
  clearAiCursor(editor);
}

/**
 * Trocea HTML respetando tags. No es perfecto pero evita romper estructura
 * grosera (cierra tags al final de cada chunk si es posible).
 */
function chunkHtml(html: string, target: number): string[] {
  const result: string[] = [];
  let buffer = '';
  let i = 0;
  while (i < html.length) {
    const ch = html[i]!;
    buffer += ch;
    if (ch === '<') {
      // Consumir tag completo
      const close = html.indexOf('>', i);
      if (close !== -1) {
        buffer += html.slice(i + 1, close + 1);
        i = close + 1;
        continue;
      }
    }
    if (buffer.length >= target && (ch === ' ' || ch === '\n' || ch === '>')) {
      result.push(buffer);
      buffer = '';
    }
    i++;
  }
  if (buffer) result.push(buffer);
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
