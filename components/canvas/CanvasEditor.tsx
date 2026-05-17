'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { Markdown } from 'tiptap-markdown';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { WordToolbar } from './WordToolbar';
import { FontSize } from '@/lib/canvas/font-size-extension';
import { useCollaboration } from '@/lib/canvas/use-collaboration';
import { Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/lib/stores/canvas-store';
import { AICursorPlugin, applyHtmlStreaming } from './streaming';
import { Extension } from '@tiptap/core';
import { SlashMenu, preloadSlashTemplates } from './SlashMenu';
import { AIBubbleMenu } from './AIBubbleMenu';

const AICursorExtension = Extension.create({
  name: 'lexaiAiCursor',
  addProseMirrorPlugins() {
    return [AICursorPlugin()];
  },
});

const CURSOR_COLORS = [
  '#9333ea', '#d97706', '#dc2626', '#0891b2', '#16a34a',
  '#db2777', '#7c3aed', '#0284c7', '#65a30d', '#ea580c',
];

function hashColorForCursor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return CURSOR_COLORS[Math.abs(h) % CURSOR_COLORS.length]!;
}

const AUTOSAVE_DEBOUNCE_MS = 3_000;

type CanvasEditorProps = {
  matterId: string;
  documentId?: string;
  initialContent?: string;
  /** Si true, agente puede escribir; si false, sólo lectura. */
  agentCanWrite?: boolean;
  onSavedVersion?: (versionId: string) => void;
  /** Info del usuario actual para la presencia colaborativa (Sprint J). */
  userInfo?: { name: string; email?: string };
};

type TemplateMeta = {
  kind: string;
  title: string;
  description: string;
  applicable: string;
};

export function CanvasEditor({
  matterId,
  documentId,
  initialContent = '',
  agentCanWrite = true,
  onSavedVersion,
  userInfo,
}: CanvasEditorProps) {
  const [agentBusy, setAgentBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [userTypingAt, setUserTypingAt] = useState<number>(0);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplLoading, setTplLoading] = useState(false);
  const tplBtnRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storePublishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOpsRef = useRef<Array<() => void>>([]);

  // Sprint J · colaboración en vivo (no-op si NEXT_PUBLIC_COLLAB_ENABLED no está)
  const collab = useCollaboration(matterId, userInfo);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Si hay collab, Yjs maneja la historia · desactivamos history nativo
        history: collab ? false : undefined,
      }),
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      ...(collab
        ? [
            Collaboration.configure({ document: collab.ydoc }),
            CollaborationCursor.configure({
              provider: collab.provider,
              user: userInfo
                ? { name: userInfo.name, color: hashColorForCursor(userInfo.email || userInfo.name) }
                : undefined,
            }),
          ]
        : []),
      Placeholder.configure({
        placeholder: 'Empieza a escribir o dile a LexAI: "redacta una tutela"…',
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
        HTMLAttributes: { class: 'text-accent underline underline-offset-2', rel: 'noopener noreferrer' },
      }),
      Table.configure({ resizable: false, HTMLAttributes: { class: 'border-collapse w-full text-[13px]' } }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      AICursorExtension,
      SlashMenu.configure({
        onTransform: (action: string) => {
          toast.info(`Para "${action}" selecciona texto primero y usa el menú flotante.`);
        },
        onTemplate: async (kind: string, ed: Editor) => {
          try {
            const res = await fetch(`/api/legal-templates?kind=${encodeURIComponent(kind)}`);
            if (!res.ok) throw new Error(await res.text());
            const data = (await res.json()) as { markdown: string; title: string };
            const hasContent = ed.getText().trim().length > 0;
            const ok = hasContent
              ? window.confirm(`Reemplazar el documento con "${data.title}"?`)
              : true;
            if (!ok) return;
            const html = parseMarkdown(ed, data.markdown);
            void applyHtmlStreaming(ed, html, 'replace');
            toast.success(`Plantilla "${data.title}" cargada`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error cargando plantilla');
          }
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'lexai-word-page focus:outline-none',
      },
      handleDOMEvents: {
        keydown: () => {
          setUserTypingAt(Date.now());
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      // Debounced auto-save al matter_document_versions
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const html = editor.getHTML();
        void doSave(html);
      }, AUTOSAVE_DEBOUNCE_MS);
      // Short-debounced publish al canvas store (consumido por sidebar
      // de citas, pre-flight validator, etc.). 600ms da feedback rápido
      // sin recomputar regex en cada keystroke.
      if (storePublishTimerRef.current) clearTimeout(storePublishTimerRef.current);
      storePublishTimerRef.current = setTimeout(() => {
        useCanvasStore.getState().setMarkdown(getMarkdownSafe(editor));
      }, 600);
    },
  });

  // Cuando el agente intenta editar mientras el usuario tipea (<2s),
  // encolamos la op y la aplicamos cuando el usuario se detenga.
  const runOpRespectingUser = useCallback((op: () => void) => {
    const sinceTyped = Date.now() - userTypingAt;
    if (sinceTyped < 2_000) {
      pendingOpsRef.current.push(op);
      return;
    }
    op();
  }, [userTypingAt]);

  // Drain pending ops cuando el usuario lleva >2s sin tipear.
  useEffect(() => {
    const i = setInterval(() => {
      if (pendingOpsRef.current.length === 0) return;
      const sinceTyped = Date.now() - userTypingAt;
      if (sinceTyped > 2_000) {
        const ops = pendingOpsRef.current.splice(0);
        for (const op of ops) op();
      }
    }, 500);
    return () => clearInterval(i);
  }, [userTypingAt]);

  // Cargar lista de plantillas disponibles al montar.
  useEffect(() => {
    let cancelled = false;
    void fetch('/api/legal-templates')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((data: { templates?: TemplateMeta[] }) => {
        if (!cancelled && Array.isArray(data.templates)) {
          setTemplates(data.templates);
        }
      })
      .catch((e) => {
        console.warn('[CanvasEditor] templates fetch failed:', e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Preload plantillas dentro del slash menu (storage del editor).
  useEffect(() => {
    if (!editor) return;
    void preloadSlashTemplates(editor);
  }, [editor]);

  // Sincroniza el documentId actual con el canvas store (consumido por
  // panels laterales: citas, pre-flight, suma, etc.). Hidratación inicial
  // del markdown cuando el editor monta con contenido guardado.
  useEffect(() => {
    if (!editor) return;
    const store = useCanvasStore.getState();
    store.setDocumentId(documentId ?? null);
    store.setMarkdown(getMarkdownSafe(editor));
    return () => {
      // Reset solo si seguimos siendo el doc activo (evita race con un
      // remount inmediato hacia otro caso).
      const cur = useCanvasStore.getState();
      if (cur.documentId === (documentId ?? null)) cur.reset();
    };
  }, [editor, documentId]);

  // Click-outside / Escape para cerrar el dropdown de plantillas.
  useEffect(() => {
    if (!tplOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!tplBtnRef.current) return;
      if (!tplBtnRef.current.contains(e.target as Node)) setTplOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTplOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [tplOpen]);

  const loadTemplate = useCallback(
    async (kind: string) => {
      if (!editor) return;
      setTplLoading(true);
      try {
        const res = await fetch(`/api/legal-templates?kind=${encodeURIComponent(kind)}`);
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { markdown: string; title: string };
        const hasContent = editor.getText().trim().length > 0;
        const ok = hasContent
          ? window.confirm(
              `Esto reemplazará el contenido actual del documento con la plantilla "${data.title}". ¿Continuar?`,
            )
          : true;
        if (!ok) return;
        editor.commands.setContent(parseMarkdown(editor, data.markdown));
        toast.success(`Plantilla "${data.title}" cargada`);
        setTplOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error cargando plantilla');
      } finally {
        setTplLoading(false);
      }
    },
    [editor],
  );

  async function doSave(html: string): Promise<void> {
    if (!matterId || !documentId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/matter-documents/${documentId}/version`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ html }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { version_id: string };
      setLastSaved(new Date());
      onSavedVersion?.(data.version_id);
    } catch (e) {
      // No molestar al usuario con cada autosave fail; solo console
      console.warn('[CanvasEditor] autosave failed:', e);
    } finally {
      setSaving(false);
    }
  }

  // Registrar API en UICommandBus para que el agente pueda manipular el doc.
  useEffect(() => {
    if (!editor || !agentCanWrite) return;
    const api = {
      get_current: () => ({
        text: editor.getText(),
        html: editor.getHTML(),
        markdown: getMarkdownSafe(editor),
        word_count: editor.getText().split(/\s+/).filter(Boolean).length,
      }),
      set_text: (markdown: string) => {
        runOpRespectingUser(() => {
          setAgentBusy(true);
          const html = parseMarkdown(editor, markdown);
          void applyHtmlStreaming(editor, html, 'replace').finally(() => {
            setTimeout(() => setAgentBusy(false), 200);
          });
        });
      },
      /** Streaming en vivo · cada delta del SSE llama esto con el markdown
       *  acumulado hasta ahora. Sin animación interna ni queue de tipeo:
       *  el efecto de typing lo produce la cadencia de los chunks del SSE. */
      stream_set_text: (markdown: string) => {
        setAgentBusy(true);
        try {
          // Sanitize: si el último char del markdown abre lista (`- `, `* `,
          // `1. `, encabezado `# ` o tabla `|`), aún no hay contenido del item.
          // TipTap rechaza nodos listItem/heading/table vacíos. Recortar la
          // línea incompleta del final antes de parsear.
          const lines = markdown.split('\n');
          while (lines.length > 0) {
            const last = lines[lines.length - 1]!;
            // bullet/ordered/heading abierto sin contenido
            if (/^\s*(?:[-*]\s*$|\d+\.\s*$|#{1,6}\s*$)/.test(last)) {
              lines.pop();
              continue;
            }
            break;
          }
          const safeMd = lines.join('\n');
          const html = parseMarkdown(editor, safeMd);
          // Quitar <li></li> vacíos por si quedó algún caso edge (markdown
          // con `- algo \n - ` → último li vacío). Idem <p></p>.
          const cleanHtml = html
            .replace(/<li>\s*<\/li>/g, '')
            .replace(/<li>\s*<p>\s*<\/p>\s*<\/li>/g, '')
            .replace(/<(ul|ol)>\s*<\/\1>/g, '');
          editor.commands.setContent(cleanHtml, false, { preserveWhitespace: 'full' });
        } catch (e) {
          // Silencio el log para no spammear durante el streaming · el siguiente
          // chunk normalmente trae contenido válido y se recupera.
        }
      },
      stream_finish: () => {
        setAgentBusy(false);
      },
      append: (markdown: string) => {
        runOpRespectingUser(() => {
          setAgentBusy(true);
          const html = parseMarkdown(editor, markdown);
          void applyHtmlStreaming(editor, html, 'append').finally(() => {
            setTimeout(() => setAgentBusy(false), 200);
          });
        });
      },
      replace_section: (heading: string, newMarkdown: string) => {
        runOpRespectingUser(() => {
          setAgentBusy(true);
          const replaced = replaceSectionByHeading(editor, heading, parseMarkdown(editor, newMarkdown));
          if (!replaced) {
            const html = parseMarkdown(editor, newMarkdown);
            void applyHtmlStreaming(editor, html, 'append').finally(() => {
              setTimeout(() => setAgentBusy(false), 200);
            });
          } else {
            setTimeout(() => setAgentBusy(false), 200);
          }
        });
      },
      insert_at_cursor: (markdown: string) => {
        runOpRespectingUser(() => {
          setAgentBusy(true);
          const html = parseMarkdown(editor, markdown);
          void applyHtmlStreaming(editor, html, 'insert').finally(() => {
            setTimeout(() => setAgentBusy(false), 200);
          });
        });
      },
      find_replace: (needle: string, replacement: string) => {
        let count = 0;
        runOpRespectingUser(() => {
          setAgentBusy(true);
          count = findAndReplaceAll(editor, needle, replacement);
          setTimeout(() => setAgentBusy(false), 300);
        });
        return { count };
      },
      select_section: (heading: string) => {
        const ok = selectSectionByHeading(editor, heading);
        return { found: ok };
      },
      save_version: async () => {
        await doSave(editor.getHTML());
      },
    };
    return uiCommandBus.registerCanvasApi(api);
  }, [editor, agentCanWrite, runOpRespectingUser, matterId, documentId]);

  if (!editor) return null;

  return (
    <div className="surface flex h-full min-h-0 flex-col overflow-hidden">
      {/* Toolbar Word-like principal · Sprint I */}
      <WordToolbar editor={editor} />

      {/* Segunda fila · plantillas + status + guardar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-2 py-1">
        <div ref={tplBtnRef} className="relative">
          <button
            type="button"
            onClick={() => setTplOpen((v) => !v)}
            disabled={tplLoading || templates.length === 0}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded px-2 text-[11.5px] transition',
              'hover:bg-bg-sunken disabled:cursor-not-allowed disabled:opacity-50',
              tplOpen && 'bg-accent-soft text-accent-ink',
            )}
            title="Cargar plantilla legal"
          >
            <span aria-hidden>📋</span>
            <span>Plantillas</span>
            <span className="text-[10px] opacity-70">▾</span>
          </button>
          {tplOpen && templates.length > 0 && (
            <div
              className="absolute left-0 top-full z-30 mt-1 w-[340px] overflow-hidden rounded-md border border-line bg-bg shadow-lg"
              role="menu"
            >
              <div className="border-b border-line bg-bg-sunken px-3 py-1.5 text-[11px] muted">
                {templates.length} plantillas profesionales · Colombia
              </div>
              <div className="max-h-[360px] overflow-auto">
                {templates.map((t) => (
                  <button
                    key={t.kind}
                    type="button"
                    onClick={() => void loadTemplate(t.kind)}
                    disabled={tplLoading}
                    className="flex w-full flex-col items-start gap-0.5 border-b border-line/60 px-3 py-2 text-left transition last:border-0 hover:bg-bg-sunken disabled:opacity-50"
                    role="menuitem"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-[13px] font-medium">{t.title}</span>
                      <span className="chip chip-purple shrink-0 text-[9.5px]">
                        {t.applicable}
                      </span>
                    </div>
                    <span className="text-[11px] muted line-clamp-2">{t.description}</span>
                  </button>
                ))}
              </div>
              {tplLoading && (
                <div className="border-t border-line px-3 py-1.5 text-[11px] muted">
                  Cargando…
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 text-[11px] muted">
          {collab && (
            <span
              title={`Colaboración ${collab.connected ? 'conectada' : 'desconectada'} · ${collab.peers} usuario(s)`}
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5',
                collab.connected ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn',
              )}
            >
              <Users2 size={11} /> {collab.peers}
            </span>
          )}
          {agentBusy && (
            <span className="chip chip-purple">
              <span className="dot" /> LexAI escribiendo…
            </span>
          )}
          {saving ? (
            <span>Guardando…</span>
          ) : lastSaved ? (
            <span>Guardado {lastSaved.toLocaleTimeString('es-CO')}</span>
          ) : null}
          <button
            type="button"
            onClick={() => void doSave(editor.getHTML())}
            className="btn btn-sm"
          >
            {Ic.bookmark} Guardar versión
          </button>
        </div>
      </div>

      {/* Editor body en página A4 con sombra · efecto Word */}
      <AIBubbleMenu editor={editor} />
      <div
        className={cn(
          'lexai-word-shell flex-1 overflow-auto',
          agentBusy && 'pointer-events-none opacity-95',
        )}
      >
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center gap-3 border-t border-line px-3 py-1.5 text-[10.5px] muted">
        <span>
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length}{' '}
          caracteres · ~{editor.getText().split(/\s+/).filter(Boolean).length} palabras
        </span>
        <span>· Página A4 · Times 12pt</span>
        <span>· Autoguardado cada 3s</span>
      </div>
    </div>
  );
}

// Toolbar legacy reemplazada por WordToolbar (Sprint I).
// ToolbarButton/Divider eliminados · si necesitas botones custom usa WordToolbar.

// ─────────────────────────────────────────────────────────────────────
// Helpers ProseMirror · usan tiptap-markdown como parser real
// ─────────────────────────────────────────────────────────────────────

type MarkdownStorage = {
  parser?: { parse: (src: string) => string };
  serializer?: { serialize: (doc: unknown) => string };
  getMarkdown?: () => string;
};

/** Convierte markdown → HTML usando el parser oficial registrado por tiptap-markdown. */
function parseMarkdown(editor: Editor, markdown: string): string {
  if (!markdown) return '';
  const storage = editor.storage.markdown as MarkdownStorage | undefined;
  if (storage?.parser?.parse) return storage.parser.parse(markdown);
  return markdown; // fallback: pasar tal cual; tiptap intentará interpretarlo
}

/** Devuelve el documento serializado a markdown (vía tiptap-markdown). */
function getMarkdownSafe(editor: Editor): string {
  const storage = editor.storage.markdown as MarkdownStorage | undefined;
  if (storage?.getMarkdown) return storage.getMarkdown();
  return editor.getText();
}

/**
 * Reemplaza el contenido entre un heading y el siguiente heading hermano.
 * Match por substring case-insensitive del título.
 * Devuelve true si se reemplazó, false si no se encontró.
 */
function replaceSectionByHeading(editor: Editor, headingText: string, newHtml: string): boolean {
  const needle = headingText.toLowerCase().trim();
  const doc = editor.state.doc;
  let headingPos = -1;
  let headingLevel = 0;
  doc.descendants((node, pos) => {
    if (headingPos !== -1) return false;
    if (node.type.name === 'heading' && node.textContent.toLowerCase().includes(needle)) {
      headingPos = pos;
      headingLevel = (node.attrs as { level?: number }).level ?? 1;
      return false;
    }
    return undefined;
  });
  if (headingPos === -1) return false;

  const headingNode = doc.nodeAt(headingPos);
  if (!headingNode) return false;
  const fromPos = headingPos + headingNode.nodeSize;

  // Buscar el siguiente heading de nivel <= al actual (sección hermana o superior)
  let toPos = doc.content.size;
  doc.descendants((node, pos) => {
    if (pos <= headingPos) return undefined;
    if (node.type.name === 'heading') {
      const lvl = (node.attrs as { level?: number }).level ?? 1;
      if (lvl <= headingLevel) {
        toPos = pos;
        return false;
      }
    }
    return undefined;
  });

  editor
    .chain()
    .focus()
    .deleteRange({ from: fromPos, to: toPos })
    .insertContentAt(fromPos, newHtml)
    .run();
  return true;
}

/**
 * Busca todas las ocurrencias de `find` (texto plano) y las reemplaza por `replace`.
 * Itera de derecha a izquierda para no invalidar posiciones.
 * Devuelve la cantidad de matches reemplazados.
 */
function findAndReplaceAll(editor: Editor, find: string, replace: string): number {
  if (!find) return 0;
  const positions: Array<{ from: number; to: number }> = [];
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return undefined;
    let idx = node.text.indexOf(find);
    while (idx !== -1) {
      positions.push({ from: pos + idx, to: pos + idx + find.length });
      idx = node.text.indexOf(find, idx + find.length);
    }
    return undefined;
  });
  if (positions.length === 0) return 0;
  positions.sort((a, b) => b.from - a.from);
  const tr = editor.state.tr;
  for (const { from, to } of positions) {
    tr.replaceWith(from, to, editor.schema.text(replace));
  }
  editor.view.dispatch(tr);
  return positions.length;
}

/**
 * Sitúa el caret justo después del heading que matchee (substring case-insensitive).
 * Devuelve true si encontró el heading.
 */
function selectSectionByHeading(editor: Editor, headingText: string): boolean {
  const needle = headingText.toLowerCase().trim();
  let target = -1;
  editor.state.doc.descendants((node, pos) => {
    if (target !== -1) return false;
    if (node.type.name === 'heading' && node.textContent.toLowerCase().includes(needle)) {
      target = pos + node.nodeSize;
      return false;
    }
    return undefined;
  });
  if (target === -1) return false;
  editor.chain().focus().setTextSelection(target).run();
  return true;
}
