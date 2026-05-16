'use client';

/**
 * Sprint I · WordToolbar
 *
 * Toolbar estilo Microsoft Word para el Canvas:
 *   Grupo 1 · Fuente + Tamaño
 *   Grupo 2 · Bold / Italic / Underline / Strike
 *   Grupo 3 · Color de texto + Resaltado
 *   Grupo 4 · Encabezados (H1, H2, H3, Normal)
 *   Grupo 5 · Alineación (izq, centro, der, justificada)
 *   Grupo 6 · Listas (viñetas, numeradas, tareas)
 *   Grupo 7 · Indent (aumentar/disminuir)
 *   Grupo 8 · Insertar (tabla, link, separador, cita, bloque código)
 *   Grupo 9 · Deshacer / Rehacer
 *
 * Diseñado para verse fielmente como la cinta de Word: agrupado con
 * separadores verticales y botones con tooltip de atajo.
 */

import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Indent,
  Outdent,
  Quote,
  Code2,
  Link2,
  Table as TableIcon,
  Minus,
  Undo2,
  Redo2,
  Highlighter,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FONT_FAMILIES = [
  { label: 'Times New Roman', value: 'Times New Roman, Times, serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Calibri', value: 'Calibri, Carlito, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Garamond', value: 'Garamond, "EB Garamond", serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
];

const FONT_SIZES = [9, 10, 11, 12, 14, 16, 18, 24, 28, 36, 48];

const TEXT_COLORS = [
  '#000000', '#404040', '#7a7a7a', '#a0a0a0', '#c0392b', '#e67e22',
  '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#16a085', '#d35400',
];

const HIGHLIGHT_COLORS = [
  '#fff2cc', '#d9ead3', '#cfe2f3', '#f4cccc', '#d9d2e9', '#fce5cd',
];

function Btn({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      disabled={disabled}
      className={cn(
        'inline-flex h-7 min-w-[28px] items-center justify-center rounded-[3px] px-1.5 text-[12px] transition-colors',
        'hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-40',
        active && 'bg-accent/15 text-accent ring-1 ring-accent/30',
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="mx-1 h-5 w-px bg-line" />;
}

export function WordToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setHeading = (level: 1 | 2 | 3 | null) => {
    if (level === null) editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level }).run();
  };

  const currentFontFamily =
    editor.getAttributes('textStyle').fontFamily || FONT_FAMILIES[0]!.value;

  const currentFontSize = (() => {
    const raw = editor.getAttributes('textStyle').fontSize as string | undefined;
    if (!raw) return 12;
    const m = /([\d.]+)/.exec(raw);
    return m ? Math.round(parseFloat(m[1]!)) : 12;
  })();

  const setFontFamily = (family: string) => {
    editor.chain().focus().setFontFamily(family).run();
  };
  const setFontSize = (px: number) => {
    // Usamos la extensión TextStyle vía addAttribute fontSize (registrada en editor).
    editor.chain().focus().setMark('textStyle', { fontSize: `${px}pt` }).run();
  };
  const setTextColor = (c: string) => editor.chain().focus().setColor(c).run();
  const setHighlight = (c: string) => editor.chain().focus().toggleHighlight({ color: c }).run();
  const clearHighlight = () => editor.chain().focus().unsetHighlight().run();

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-bg-sunken/40 px-2 py-1">
      {/* Fuente */}
      <select
        value={currentFontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
        title="Fuente"
        aria-label="Fuente"
        className="h-7 rounded-[3px] border border-line bg-bg px-1.5 text-[11.5px]"
      >
        {FONT_FAMILIES.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
            {f.label}
          </option>
        ))}
      </select>
      <select
        value={currentFontSize}
        onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
        title="Tamaño"
        aria-label="Tamaño de fuente"
        className="ml-1 h-7 w-14 rounded-[3px] border border-line bg-bg px-1.5 text-[11.5px]"
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Sep />

      {/* Formato carácter */}
      <Btn
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Negrita · Ctrl+B"
      >
        <Bold size={13} />
      </Btn>
      <Btn
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Cursiva · Ctrl+I"
      >
        <Italic size={13} />
      </Btn>
      <Btn
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Subrayado · Ctrl+U"
      >
        <UnderlineIcon size={13} />
      </Btn>
      <Btn
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Tachado"
      >
        <Strikethrough size={13} />
      </Btn>
      <Sep />

      {/* Color de texto + Highlight */}
      <div className="relative group">
        <Btn onClick={() => {}} title="Color de texto">
          <Type size={13} />
          <span
            className="ml-0.5 inline-block h-1 w-3 rounded-sm"
            style={{ background: editor.getAttributes('textStyle').color || '#000' }}
          />
        </Btn>
        <div className="absolute left-0 top-7 z-10 hidden grid-cols-6 gap-0.5 rounded-md border border-line bg-bg p-1 shadow-lg group-hover:grid">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setTextColor(c)}
              className="h-4 w-4 rounded-sm border border-line"
              style={{ background: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="relative group">
        <Btn
          active={editor.isActive('highlight')}
          onClick={clearHighlight}
          title="Resaltado · click para quitar"
        >
          <Highlighter size={13} />
        </Btn>
        <div className="absolute left-0 top-7 z-10 hidden grid-cols-6 gap-0.5 rounded-md border border-line bg-bg p-1 shadow-lg group-hover:grid">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setHighlight(c)}
              className="h-4 w-4 rounded-sm border border-line"
              style={{ background: c }}
              aria-label={`Resaltado ${c}`}
            />
          ))}
        </div>
      </div>
      <Sep />

      {/* Encabezados */}
      <select
        value={
          editor.isActive('heading', { level: 1 }) ? '1' :
          editor.isActive('heading', { level: 2 }) ? '2' :
          editor.isActive('heading', { level: 3 }) ? '3' : 'p'
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'p') setHeading(null);
          else setHeading(parseInt(v, 10) as 1 | 2 | 3);
        }}
        title="Estilo de párrafo"
        aria-label="Estilo de párrafo"
        className="h-7 rounded-[3px] border border-line bg-bg px-1.5 text-[11.5px]"
      >
        <option value="p">Normal</option>
        <option value="1">Título 1</option>
        <option value="2">Título 2</option>
        <option value="3">Título 3</option>
      </select>
      <Sep />

      {/* Alineación */}
      <Btn
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Alinear izquierda · Ctrl+L"
      >
        <AlignLeft size={13} />
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Centrar · Ctrl+E"
      >
        <AlignCenter size={13} />
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Alinear derecha · Ctrl+R"
      >
        <AlignRight size={13} />
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        title="Justificar · Ctrl+J"
      >
        <AlignJustify size={13} />
      </Btn>
      <Sep />

      {/* Listas */}
      <Btn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Lista con viñetas"
      >
        <List size={13} />
      </Btn>
      <Btn
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Lista numerada"
      >
        <ListOrdered size={13} />
      </Btn>
      <Btn
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Lista de tareas"
      >
        <ListChecks size={13} />
      </Btn>
      <Sep />

      {/* Sangría */}
      <Btn
        onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
        title="Aumentar sangría"
      >
        <Indent size={13} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().liftListItem('listItem').run()}
        title="Disminuir sangría"
      >
        <Outdent size={13} />
      </Btn>
      <Sep />

      {/* Insertar */}
      <Btn
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Cita en bloque"
      >
        <Quote size={13} />
      </Btn>
      <Btn
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Bloque de código"
      >
        <Code2 size={13} />
      </Btn>
      <Btn
        active={editor.isActive('link')}
        onClick={() => {
          const url = window.prompt('URL del enlace:', editor.getAttributes('link').href || '');
          if (url === null) return;
          if (!url) editor.chain().focus().unsetLink().run();
          else editor.chain().focus().setLink({ href: url }).run();
        }}
        title="Insertar enlace · Ctrl+K"
      >
        <Link2 size={13} />
      </Btn>
      <Btn
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        title="Insertar tabla 3×3"
      >
        <TableIcon size={13} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Separador horizontal"
      >
        <Minus size={13} />
      </Btn>
      <Sep />

      {/* Undo/Redo */}
      <Btn
        onClick={() => editor.chain().focus().undo().run()}
        title="Deshacer · Ctrl+Z"
        disabled={!editor.can().undo()}
      >
        <Undo2 size={13} />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().redo().run()}
        title="Rehacer · Ctrl+Y"
        disabled={!editor.can().redo()}
      >
        <Redo2 size={13} />
      </Btn>
    </div>
  );
}
