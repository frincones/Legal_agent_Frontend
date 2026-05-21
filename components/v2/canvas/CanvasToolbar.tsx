'use client';

/**
 * F5-T03 · LexAI UX v2 — CanvasToolbar
 *
 * Toolbar tipo Word/Google Docs para CanvasV2.
 * Todos los botones son icon-only con tooltip (Radix), 28px cuadrados.
 * Grupos separados por divisores visuales.
 *
 * Grupos:
 *   1. Bold · Italic · Underline · Strike
 *   2. H1 · H2 · H3
 *   3. BulletList · OrderedList · Outdent · Indent
 *   4. AlignLeft · AlignCenter · AlignRight · AlignJustify
 *   5. Color de texto · Highlight · Font size selector
 *   6. Link · Tabla · HR · Quote · Code · CodeBlock
 *   7. Verificar citas · Detectar derogación
 *   8. Undo · Redo + indicador de guardado
 */

import { useRef, type ChangeEvent } from 'react';
import { type Editor } from '@tiptap/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  Link2,
  Table2,
  Minus,
  Quote,
  Code,
  FileCode,
  ScanLine,
  AlertTriangle,
  Undo2,
  Redo2,
  Type,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CanvasToolbarProps {
  editor: Editor;
  onVerifyCitations: () => void;
  onDetectDerogation: () => void;
  saving: boolean;
  lastSaved: Date | null;
}

// ─── Font size options ────────────────────────────────────────────────────────

const FONT_SIZES = ['10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt', '28pt', '32pt', '36pt'];

// ─── Primitives ───────────────────────────────────────────────────────────────

const SEP = () => (
  <div
    aria-hidden
    style={{
      width: 1,
      alignSelf: 'stretch',
      margin: '2px 4px',
      backgroundColor: 'var(--v2-border-default, #DDDBD3)',
      flexShrink: 0,
    }}
  />
);

interface TipBtnProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TipBtn({ label, active, disabled, onClick, children }: TipBtnProps) {
  return (
    <Tooltip.Root delayDuration={400}>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 26,
            borderRadius: 4,
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            backgroundColor: active
              ? 'var(--v2-bg-subtle, #F2F1EC)'
              : 'transparent',
            color: active
              ? 'var(--v2-text-primary, #1A1916)'
              : 'var(--v2-text-secondary, #5A5850)',
            transition: 'background-color 100ms',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!disabled && !active) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--v2-bg-subtle, #F2F1EC)';
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'transparent';
            }
          }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1"
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="bottom"
          sideOffset={4}
          style={{
            fontSize: 11,
            padding: '3px 7px',
            borderRadius: 4,
            backgroundColor: 'var(--v2-brand-navy, #0E2A5E)',
            color: '#fff',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {label}
          <Tooltip.Arrow style={{ fill: 'var(--v2-brand-navy, #0E2A5E)' }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// ─── ColorPicker input wrapper ────────────────────────────────────────────────

interface ColorPickerBtnProps {
  label: string;
  currentColor?: string;
  onColorChange: (color: string) => void;
  children: React.ReactNode;
}

function ColorPickerBtn({ label, currentColor, onColorChange, children }: ColorPickerBtnProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Tooltip.Root delayDuration={400}>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 5,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: 'var(--v2-text-secondary, #5A5850)',
            transition: 'background-color 100ms',
            position: 'relative',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--v2-bg-subtle, #F2F1EC)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-brand-navy,#0E2A5E)] focus-visible:ring-offset-1"
        >
          {children}
          <input
            ref={inputRef}
            type="color"
            defaultValue={currentColor ?? '#000000'}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onColorChange(e.target.value)}
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              opacity: 0,
              pointerEvents: 'none',
            }}
            tabIndex={-1}
            aria-hidden
          />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="bottom"
          sideOffset={4}
          style={{
            fontSize: 11,
            padding: '3px 7px',
            borderRadius: 4,
            backgroundColor: 'var(--v2-brand-navy, #0E2A5E)',
            color: '#fff',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {label}
          <Tooltip.Arrow style={{ fill: 'var(--v2-brand-navy, #0E2A5E)' }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// ─── FontSizeSelect ───────────────────────────────────────────────────────────

function FontSizeSelect({ editor }: { editor: Editor }) {
  const currentSize =
    (editor.getAttributes('textStyle').fontSize as string | undefined) ?? '';

  return (
    <Tooltip.Root delayDuration={400}>
      <Tooltip.Trigger asChild>
        <div style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          <Type size={11} style={{ color: 'var(--v2-text-tertiary, #7A7870)', marginRight: 2 }} aria-hidden />
          <select
            aria-label="Tamaño de fuente"
            value={currentSize}
            onChange={(e) => {
              const size = e.target.value;
              if (!size) {
                editor.chain().focus().unsetMark('textStyle').run();
              } else {
                editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
              }
            }}
            style={{
              height: 22,
              border: '1px solid var(--v2-border-default, #DDDBD3)',
              borderRadius: 4,
              fontSize: 11,
              backgroundColor: 'transparent',
              color: 'var(--v2-text-primary, #1A1916)',
              cursor: 'pointer',
              outline: 'none',
              paddingLeft: 2,
              paddingRight: 2,
              maxWidth: 54,
            }}
          >
            <option value="">—</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="bottom"
          sideOffset={4}
          style={{
            fontSize: 11,
            padding: '3px 7px',
            borderRadius: 4,
            backgroundColor: 'var(--v2-brand-navy, #0E2A5E)',
            color: '#fff',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          Tamaño de fuente
          <Tooltip.Arrow style={{ fill: 'var(--v2-brand-navy, #0E2A5E)' }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// ─── LexAI-branded action button ─────────────────────────────────────────────

interface LexaiBtnProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'accent' | 'default';
}

function LexaiBtn({ label, icon, onClick, variant = 'default' }: LexaiBtnProps) {
  const isAccent = variant === 'accent';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 24,
        padding: '0 8px',
        borderRadius: 5,
        border: `1px solid ${isAccent ? 'var(--v2-accent-copper, #B8763C)' : 'var(--v2-border-default, #DDDBD3)'}`,
        backgroundColor: 'transparent',
        color: isAccent ? 'var(--v2-accent-copper, #B8763C)' : 'var(--v2-text-secondary, #5A5850)',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background-color 120ms',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = isAccent
          ? 'color-mix(in srgb, var(--v2-accent-copper, #B8763C) 10%, transparent)'
          : 'var(--v2-bg-subtle, #F2F1EC)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── CanvasToolbar ─────────────────────────────────────────────────────────────

export function CanvasToolbar({
  editor,
  onVerifyCitations,
  onDetectDerogation,
  saving,
  lastSaved,
}: CanvasToolbarProps) {
  const setLink = () => {
    const url = window.prompt('URL del enlace:');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <Tooltip.Provider>
      <div
        role="toolbar"
        aria-label="Barra de herramientas del editor"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '3px 8px',
          borderBottom: '1px solid var(--v2-border-default, #DDDBD3)',
          backgroundColor: 'var(--v2-bg-base, #FAFAF7)',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          minHeight: 36,
          rowGap: 2,
        }}
      >
        {/* ── Grupo 1: Formato de carácter básico ── */}
        <TipBtn
          label="Negrita (Ctrl+B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={13} />
        </TipBtn>

        <TipBtn
          label="Cursiva (Ctrl+I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={13} />
        </TipBtn>

        <TipBtn
          label="Subrayado (Ctrl+U)"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline size={13} />
        </TipBtn>

        <TipBtn
          label="Tachado"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={13} />
        </TipBtn>

        <SEP />

        {/* ── Grupo 2: Encabezados ── */}
        <TipBtn
          label="Encabezado 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={13} />
        </TipBtn>

        <TipBtn
          label="Encabezado 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={13} />
        </TipBtn>

        <TipBtn
          label="Encabezado 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={13} />
        </TipBtn>

        <SEP />

        {/* ── Grupo 3: Listas e indentación ── */}
        <TipBtn
          label="Lista con viñetas"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={13} />
        </TipBtn>

        <TipBtn
          label="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={13} />
        </TipBtn>

        <TipBtn
          label="Disminuir sangría"
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
          disabled={!editor.can().liftListItem('listItem')}
        >
          <IndentDecrease size={13} />
        </TipBtn>

        <TipBtn
          label="Aumentar sangría"
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
          disabled={!editor.can().sinkListItem('listItem')}
        >
          <IndentIncrease size={13} />
        </TipBtn>

        <SEP />

        {/* ── Grupo 4: Alineación ── */}
        <TipBtn
          label="Alinear izquierda"
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft size={13} />
        </TipBtn>

        <TipBtn
          label="Centrar"
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter size={13} />
        </TipBtn>

        <TipBtn
          label="Alinear derecha"
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight size={13} />
        </TipBtn>

        <TipBtn
          label="Justificado"
          active={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify size={13} />
        </TipBtn>

        <SEP />

        {/* ── Grupo 5: Color, highlight y tamaño de fuente ── */}
        <ColorPickerBtn
          label="Color de texto"
          currentColor="#000000"
          onColorChange={(color) => editor.chain().focus().setColor(color).run()}
        >
          <Palette size={13} />
        </ColorPickerBtn>

        <ColorPickerBtn
          label="Resaltar texto"
          currentColor="#FFFF00"
          onColorChange={(color) =>
            editor.chain().focus().setHighlight({ color }).run()
          }
        >
          <Highlighter size={13} />
        </ColorPickerBtn>

        <FontSizeSelect editor={editor} />

        <SEP />

        {/* ── Grupo 6: Insertar elementos ── */}
        <TipBtn
          label="Insertar enlace"
          active={editor.isActive('link')}
          onClick={setLink}
        >
          <Link2 size={13} />
        </TipBtn>

        <TipBtn
          label="Insertar tabla"
          onClick={insertTable}
        >
          <Table2 size={13} />
        </TipBtn>

        <TipBtn
          label="Línea horizontal"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={13} />
        </TipBtn>

        <TipBtn
          label="Cita en bloque"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={13} />
        </TipBtn>

        <TipBtn
          label="Código inline"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={13} />
        </TipBtn>

        <TipBtn
          label="Bloque de código"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <FileCode size={13} />
        </TipBtn>

        <SEP />

        {/* ── Grupo 7: Herramientas LexAI ── */}
        <LexaiBtn
          label="Verificar citas"
          icon={<ScanLine size={12} />}
          onClick={onVerifyCitations}
          variant="accent"
        />

        <LexaiBtn
          label="Detectar derogación"
          icon={<AlertTriangle size={12} />}
          onClick={onDetectDerogation}
        />

        {/* ── Espaciador ── */}
        <div style={{ flex: 1 }} />

        {/* ── Grupo 8: Deshacer / rehacer ── */}
        <TipBtn
          label="Deshacer (Ctrl+Z)"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={13} />
        </TipBtn>

        <TipBtn
          label="Rehacer (Ctrl+Y)"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={13} />
        </TipBtn>

        <SEP />

        {/* ── Indicador de guardado ── */}
        <span
          style={{
            fontSize: 11,
            color: 'var(--v2-text-tertiary, #7A7870)',
            whiteSpace: 'nowrap',
            minWidth: 80,
            textAlign: 'right',
          }}
        >
          {saving
            ? 'Guardando...'
            : lastSaved
              ? `Guardado ${lastSaved.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
        </span>
      </div>
    </Tooltip.Provider>
  );
}
