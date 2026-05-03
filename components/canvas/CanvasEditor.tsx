'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';
import { cn } from '@/lib/utils';

const AUTOSAVE_DEBOUNCE_MS = 3_000;

type CanvasEditorProps = {
  matterId: string;
  documentId?: string;
  initialContent?: string;
  /** Si true, agente puede escribir; si false, sólo lectura. */
  agentCanWrite?: boolean;
  onSavedVersion?: (versionId: string) => void;
};

export function CanvasEditor({
  matterId,
  documentId,
  initialContent = '',
  agentCanWrite = true,
  onSavedVersion,
}: CanvasEditorProps) {
  const [agentBusy, setAgentBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [userTypingAt, setUserTypingAt] = useState<number>(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOpsRef = useRef<Array<() => void>>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Empieza a escribir o dile a LexAI: "redacta una tutela"…',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[60vh] py-6 px-4 ' +
          '[&_h1]:font-serif [&_h1]:text-[24px] [&_h1]:font-semibold [&_h1]:mt-6 ' +
          '[&_h2]:font-serif [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:mt-4 ' +
          '[&_h3]:font-serif [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-3 ' +
          '[&_p]:text-[14px] [&_p]:leading-relaxed [&_p]:mt-2 ' +
          '[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 ' +
          '[&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_blockquote]:italic',
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
        word_count: editor.getText().split(/\s+/).filter(Boolean).length,
      }),
      set_text: (markdown: string) => {
        runOpRespectingUser(() => {
          setAgentBusy(true);
          editor.commands.setContent(markdownToHtml(markdown));
          setTimeout(() => setAgentBusy(false), 300);
        });
      },
      append: (markdown: string) => {
        runOpRespectingUser(() => {
          setAgentBusy(true);
          const html = markdownToHtml(markdown);
          editor.commands.focus('end');
          editor.commands.insertContent(html);
          setTimeout(() => setAgentBusy(false), 300);
        });
      },
      replace_section: (heading: string, newMarkdown: string) => {
        runOpRespectingUser(() => {
          setAgentBusy(true);
          const replaced = replaceSectionInHtml(editor.getHTML(), heading, markdownToHtml(newMarkdown));
          editor.commands.setContent(replaced);
          setTimeout(() => setAgentBusy(false), 300);
        });
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
      {/* Toolbar manual */}
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
        <ToolbarButton
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          label="H1"
        />
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="H2"
        />
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="H3"
        />
        <Divider />
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="B"
          bold
        />
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="I"
          italic
        />
        <Divider />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="• Lista"
        />
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="1. Lista"
        />
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="❝"
        />
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          label="↶"
          title="Deshacer"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          label="↷"
          title="Rehacer"
        />

        <div className="ml-auto flex items-center gap-2 text-[11px] muted">
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

      {/* Editor body */}
      <div
        className={cn(
          'flex-1 overflow-auto',
          agentBusy && 'pointer-events-none opacity-90 bg-purple-soft/10',
        )}
      >
        <EditorContent editor={editor} />
      </div>

      <div className="border-t border-line px-3 py-1.5 text-[10.5px] muted">
        {editor.storage.characterCount?.characters?.() ??
          editor.getText().length}{' '}
        caracteres · ~
        {editor.getText().split(/\s+/).filter(Boolean).length} palabras ·
        autoguardado cada 3s
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  title,
  bold,
  italic,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  title?: string;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      className={cn(
        'inline-flex h-7 min-w-7 items-center justify-center rounded px-2 text-[12px] transition',
        'hover:bg-bg-sunken',
        active && 'bg-accent-soft text-accent-ink',
        bold && 'font-bold',
        italic && 'italic',
      )}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-line" aria-hidden />;
}

// ─────────────────────────────────────────────────────────────────────
// Markdown → HTML conversion (light, sin dependencia)
// Soporta: headings (#, ##, ###), bold (**), italic (_), listas, párrafos.
// ─────────────────────────────────────────────────────────────────────
function markdownToHtml(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (inList && listType) {
      out.push(`</${listType}>`);
      inList = false;
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    const h3 = /^###\s+(.+)/.exec(line);
    const h2 = /^##\s+(.+)/.exec(line);
    const h1 = /^#\s+(.+)/.exec(line);
    const ul = /^[-*]\s+(.+)/.exec(line);
    const ol = /^\d+\.\s+(.+)/.exec(line);

    if (h1) {
      closeList();
      out.push(`<h1>${inline(h1[1]!)}</h1>`);
    } else if (h2) {
      closeList();
      out.push(`<h2>${inline(h2[1]!)}</h2>`);
    } else if (h3) {
      closeList();
      out.push(`<h3>${inline(h3[1]!)}</h3>`);
    } else if (ul) {
      if (!inList || listType !== 'ul') {
        closeList();
        out.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      out.push(`<li>${inline(ul[1]!)}</li>`);
    } else if (ol) {
      if (!inList || listType !== 'ol') {
        closeList();
        out.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      out.push(`<li>${inline(ol[1]!)}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

function inline(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
}

// Reemplaza el contenido bajo un heading (h1/h2/h3) por nuevo HTML.
function replaceSectionInHtml(html: string, heading: string, newHtml: string): string {
  const tags: Array<'h1' | 'h2' | 'h3'> = ['h1', 'h2', 'h3'];
  for (const tag of tags) {
    const re = new RegExp(
      `(<${tag}>)([^<]*${escapeRegex(heading)}[^<]*)(</${tag}>)([\\s\\S]*?)(?=<h[123]>|$)`,
      'i',
    );
    if (re.test(html)) {
      return html.replace(re, `$1$2$3${newHtml}`);
    }
  }
  // No matching heading → append at end.
  return html + newHtml;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
