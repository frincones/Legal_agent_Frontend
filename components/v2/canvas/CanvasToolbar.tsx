'use client';

/**
 * F5-T03 · LexAI UX v2 — CanvasToolbar
 *
 * Toolbar minimalista horizontal para el CanvasV2.
 * Botones icon-only con tooltip (Radix), más 2 botones LexAI delta visibles:
 *   - Verificar citas (ScanLine)
 *   - Detectar derogación (AlertTriangle)
 * Parte derecha: Undo, Redo, indicador de guardado.
 */

import { type Editor } from '@tiptap/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Quote,
  ScanLine,
  AlertTriangle,
  Undo2,
  Redo2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CanvasToolbarProps {
  editor: Editor;
  onVerifyCitations: () => void;
  onDetectDerogation: () => void;
  saving: boolean;
  lastSaved: Date | null;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

const SEP = () => (
  <div
    aria-hidden
    style={{
      width: 1,
      alignSelf: 'stretch',
      margin: '2px 4px',
      backgroundColor: 'var(--v2-border-default, #DDDBD3)',
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
            width: 28,
            height: 28,
            borderRadius: 5,
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
          }}
        >
          {label}
          <Tooltip.Arrow style={{ fill: 'var(--v2-brand-navy, #0E2A5E)' }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
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

  return (
    <Tooltip.Provider>
      <div
        role="toolbar"
        aria-label="Barra de herramientas del editor"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '4px 8px',
          borderBottom: '1px solid var(--v2-border-default, #DDDBD3)',
          backgroundColor: 'var(--v2-bg-base, #FAFAF7)',
          flexWrap: 'wrap',
          minHeight: 40,
        }}
      >
        {/* ── Formato básico ── */}
        <TipBtn
          label="Negrita (Ctrl+B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={14} />
        </TipBtn>

        <TipBtn
          label="Cursiva (Ctrl+I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={14} />
        </TipBtn>

        <TipBtn
          label="Subrayado (Ctrl+U)"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline size={14} />
        </TipBtn>

        <SEP />

        {/* ── Encabezados ── */}
        <TipBtn
          label="Encabezado 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={14} />
        </TipBtn>

        <TipBtn
          label="Encabezado 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={14} />
        </TipBtn>

        <TipBtn
          label="Encabezado 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={14} />
        </TipBtn>

        <SEP />

        {/* ── Listas ── */}
        <TipBtn
          label="Lista con viñetas"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={14} />
        </TipBtn>

        <TipBtn
          label="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={14} />
        </TipBtn>

        {/* ── Link & cita ── */}
        <TipBtn
          label="Insertar enlace"
          active={editor.isActive('link')}
          onClick={setLink}
        >
          <Link2 size={14} />
        </TipBtn>

        <TipBtn
          label="Cita en bloque"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={14} />
        </TipBtn>

        <SEP />

        {/* ── Botones LexAI delta ── */}
        <button
          type="button"
          onClick={onVerifyCitations}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 28,
            padding: '0 10px',
            borderRadius: 5,
            border: '1px solid var(--v2-accent-copper, #B8763C)',
            backgroundColor: 'transparent',
            color: 'var(--v2-accent-copper, #B8763C)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 120ms',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'color-mix(in srgb, var(--v2-accent-copper, #B8763C) 10%, transparent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <ScanLine size={13} />
          Verificar citas
        </button>

        <button
          type="button"
          onClick={onDetectDerogation}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            height: 28,
            padding: '0 10px',
            borderRadius: 5,
            border: '1px solid var(--v2-border-default, #DDDBD3)',
            backgroundColor: 'transparent',
            color: 'var(--v2-text-secondary, #5A5850)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 120ms',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'var(--v2-bg-subtle, #F2F1EC)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          <AlertTriangle size={13} />
          Detectar derogación
        </button>

        {/* ── Espaciador ── */}
        <div style={{ flex: 1 }} />

        {/* ── Deshacer / rehacer ── */}
        <TipBtn
          label="Deshacer"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={14} />
        </TipBtn>

        <TipBtn
          label="Rehacer"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={14} />
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
