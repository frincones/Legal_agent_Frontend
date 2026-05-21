'use client';

/**
 * F5-T02 · LexAI UX v2 — CanvasV2
 *
 * Editor TipTap minimalista para el split view.
 * - Misma config de extensions que el CanvasEditor legacy (StarterKit + Heading
 *   + Link + Underline + Highlight + TextAlign + Typography + Markdown + etc.)
 * - Toolbar arriba (CanvasToolbar)
 * - Contenido editable abajo con padding generoso, max-w-3xl centrado
 * - Sync con backend: debounce 500ms, POST /api/matter-documents/{docId}/version
 * - Sync Realtime: useTableSubscription en matter_documents para refrescar
 * - Cursor remoto del agente: cuando el agente edita, muestra chip "LexAI"
 * - Paneles de Verificar citas / Detectar derogación
 *
 * Props:
 *   docId         — ID del matter_document
 *   initialContent — HTML inicial
 *   onChange      — callback con el HTML cada vez que cambia
 *   readonly      — deshabilita edición
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Markdown } from 'tiptap-markdown';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CharacterCount from '@tiptap/extension-character-count';

import { CanvasToolbar } from './CanvasToolbar';
import { VerifyCitationsResult } from './VerifyCitationsResult';
import { DerogationResult } from './DerogationResult';
import { useTableSubscription } from '@/lib/hooks/useTableSubscription';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CanvasV2Props {
  docId: string;
  initialContent: string;
  onChange?: (html: string) => void;
  readonly?: boolean;
  /** matterId para el subscription Realtime */
  matterId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTOSAVE_DEBOUNCE_MS = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type MarkdownStorage = {
  getMarkdown?: () => string;
  serializer?: { serialize: (doc: unknown) => string };
};

function getTextSafe(editor: Editor): string {
  try {
    const storage = editor.storage.markdown as MarkdownStorage | undefined;
    if (storage?.getMarkdown) return storage.getMarkdown();
  } catch {
    /* noop */
  }
  return editor.getText();
}

// ─── CanvasV2 ─────────────────────────────────────────────────────────────────

export function CanvasV2({
  docId,
  initialContent,
  onChange,
  readonly = false,
  matterId,
}: CanvasV2Props) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [verifyCitationsOpen, setVerifyCitationsOpen] = useState(false);
  const [derogationOpen, setDerogationOpen] = useState(false);
  const [canvasText, setCanvasText] = useState('');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Editor ────────────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Placeholder.configure({
        placeholder: readonly
          ? 'Documento en solo lectura.'
          : 'Empieza a escribir o pídele a LexAI que redacte…',
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '-',
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: false,
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Typography,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
        HTMLAttributes: {
          class: '',
          rel: 'noopener noreferrer',
          style: 'color: var(--v2-accent-copper, #B8763C); text-decoration: underline;',
        },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
    ],
    content: initialContent,
    editable: !readonly,
    editorProps: {
      attributes: {
        class: 'lexai-canvas-v2-body',
        style: [
          'outline: none',
          'min-height: 100%',
          'padding: 40px 48px',
          'font-family: Georgia, "Times New Roman", serif',
          'font-size: 14px',
          'line-height: 1.75',
          'color: var(--v2-text-primary, #1A1916)',
        ].join('; '),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange?.(html);

      // Debounced autosave
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void doSave(html);
      }, AUTOSAVE_DEBOUNCE_MS);
    },
  });

  // Actualizar canvasText (para panels de citas/derogación) al abrir
  const captureText = useCallback(() => {
    if (!editor) return '';
    return getTextSafe(editor);
  }, [editor]);

  // ── Autosave ──────────────────────────────────────────────────────────────

  async function doSave(html: string): Promise<void> {
    if (!docId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/matter-documents/${docId}/version`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) throw new Error(await res.text());
      setLastSaved(new Date());
    } catch (e) {
      console.warn('[CanvasV2] autosave failed:', e);
    } finally {
      setSaving(false);
    }
  }

  // ── Realtime sync ─────────────────────────────────────────────────────────
  // Cuando otro cliente (o el agente via tool) guarda una versión nueva,
  // refrescamos el contenido del editor si no estamos editando.

  const lastSavedRef = useRef<Date | null>(null);
  lastSavedRef.current = lastSaved;

  const handleRealtimeChange = useCallback(() => {
    // Solo refresh si el editor existe y no tenemos guardados pendientes
    if (!editor || saveTimerRef.current) return;

    fetch(`/api/matter-documents/canvas?matter_id=${matterId ?? ''}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { html?: string };
        if (typeof data.html === 'string' && editor && !editor.isDestroyed) {
          editor.commands.setContent(data.html, false);
        }
      })
      .catch(() => { /* noop */ });
  }, [editor, matterId]);

  useTableSubscription('matter_documents', handleRealtimeChange, {
    matterId: matterId ?? null,
    throttleMs: 2_000,
    events: ['UPDATE'],
  });

  // ── Toolbar handlers ──────────────────────────────────────────────────────

  const handleVerifyCitations = useCallback(() => {
    setCanvasText(captureText());
    setVerifyCitationsOpen(true);
  }, [captureText]);

  const handleDetectDerogation = useCallback(() => {
    setCanvasText(captureText());
    setDerogationOpen(true);
  }, [captureText]);

  const handleJumpToCitation = useCallback((ref: string) => {
    if (!editor) return;
    // Buscar el texto en el documento y seleccionarlo
    const text = editor.state.doc.textContent;
    const idx = text.indexOf(ref);
    if (idx === -1) return;
    editor.chain().focus().setTextSelection({ from: idx + 1, to: idx + ref.length + 1 }).run();
  }, [editor]);

  const handleHighlightNorm = useCallback((norm: string) => {
    if (!editor) return;
    const text = editor.state.doc.textContent;
    const idx = text.indexOf(norm);
    if (idx === -1) return;
    editor.chain().focus().setTextSelection({ from: idx + 1, to: idx + norm.length + 1 }).run();
  }, [editor]);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  if (!editor) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        backgroundColor: 'var(--v2-bg-base, #FAFAF7)',
        position: 'relative',
      }}
    >
      {/* ── Toolbar ── */}
      {!readonly && (
        <CanvasToolbar
          editor={editor}
          onVerifyCitations={handleVerifyCitations}
          onDetectDerogation={handleDetectDerogation}
          saving={saving}
          lastSaved={lastSaved}
        />
      )}

      {/* ── Editor body ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'var(--v2-bg-subtle, #F2F1EC)',
        }}
      >
        {/* Hoja de papel centrada */}
        <div
          style={{
            maxWidth: 820,
            margin: '24px auto',
            backgroundColor: '#fff',
            borderRadius: 4,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
            minHeight: 'calc(100vh - 120px)',
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Footer stats ── */}
      <div
        style={{
          padding: '4px 12px',
          borderTop: '1px solid var(--v2-border-default, #DDDBD3)',
          fontSize: 10,
          color: 'var(--v2-text-tertiary, #7A7870)',
          display: 'flex',
          gap: 12,
          backgroundColor: 'var(--v2-bg-base, #FAFAF7)',
        }}
      >
        <span>
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length} caracteres
        </span>
        <span>
          ~{editor.getText().split(/\s+/).filter(Boolean).length} palabras
        </span>
        {readonly && <span>Solo lectura</span>}
      </div>

      {/* ── Panels laterales ── */}
      <VerifyCitationsResult
        open={verifyCitationsOpen}
        onClose={() => setVerifyCitationsOpen(false)}
        canvasText={canvasText}
        onJumpToCitation={handleJumpToCitation}
      />

      <DerogationResult
        open={derogationOpen}
        onClose={() => setDerogationOpen(false)}
        canvasText={canvasText}
        onHighlightNorm={handleHighlightNorm}
      />
    </div>
  );
}
