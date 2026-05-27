"use client";

/**
 * M19.16.F1 — Canvas editable post-generación (Harvey AI style).
 *
 * Tras la generación, cada bloque del documento se monta como un editor TipTap
 * minimal independiente. Al perder foco (blur) hace PATCH al backend con el
 * nuevo contenido. Los bloques no-texto (norma_citada, jurisprudencia, table,
 * calc_step, firma) son read-only y se renderizan vía BlockRenderer existente.
 *
 * Convención de conversión:
 *   runs[]  ↔  HTML  ↔  TipTap doc
 *   {text, bold, italic, underline} ↔ <strong>/<em>/<u>/texto
 */

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import type { Block, Run } from "@/lib/types/blocks";
import { BlockRenderer } from "./BlockRenderer";

// ============================================================
// Tipos
// ============================================================

interface Props {
  blocks: Block[];
  documentId: string;
  onSelectionAsk?: (selection: SelectionContext) => void;
  /**
   * M19.17.D — timestamp del último REPLACE_BLOCKS externo. Si cambia, los
   * editores TipTap que NO están en edición local se remontan para reflejar
   * el nuevo contenido.
   */
  lastEditAt?: number | null;
}

export interface SelectionContext {
  block_id: string;
  text: string;
  // posición opcional dentro del bloque (para reemplazar después)
  from?: number;
  to?: number;
  // M19.17.A — contexto inmediato para que el backend pueda hacer find-and-replace
  // sin ambigüedad cuando el texto seleccionado aparece varias veces en el bloque
  anchor_before?: string;
  anchor_after?: string;
}

// M19.17.A — cuántos chars antes/después de la selección guardar como anchor
const ANCHOR_CHARS = 32;

const EDITABLE_BLOCK_TYPES = new Set<Block["type"]>([
  "paragraph",
  "hecho",
  "pretension",
  "list_item",
  "subsection",
]);

// ============================================================
// Conversores runs ↔ HTML
// ============================================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function runsToHtml(runs: Run[]): string {
  if (!runs || runs.length === 0) return "<p></p>";
  const inner = runs
    .map((r) => {
      let html = escapeHtml(r.text || "");
      if (r.bold) html = `<strong>${html}</strong>`;
      if (r.italic) html = `<em>${html}</em>`;
      if (r.underline) html = `<u>${html}</u>`;
      return html;
    })
    .join("");
  return `<p>${inner}</p>`;
}

/**
 * Convierte el HTML actual del editor en runs[]. Usa el DOM parser (browser).
 * Implementación simple: recorre nodos del primer <p> y mapea marks.
 */
function htmlToRuns(html: string): Run[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<root>${html}</root>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return [{ text: "" }];

  const runs: Run[] = [];

  function walk(node: Node, mark: { bold?: boolean; italic?: boolean; underline?: boolean }) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text.length > 0) runs.push({ text, ...mark });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const nextMark = { ...mark };
    if (tag === "strong" || tag === "b") nextMark.bold = true;
    if (tag === "em" || tag === "i") nextMark.italic = true;
    if (tag === "u") nextMark.underline = true;
    for (const child of Array.from(el.childNodes)) walk(child, nextMark);
  }

  for (const child of Array.from(root.childNodes)) walk(child, {});
  if (runs.length === 0) runs.push({ text: "" });
  return runs;
}

// ============================================================
// Editor por bloque
// ============================================================

interface BlockEditorProps {
  block: Block & { runs?: Run[] };
  documentId: string;
  onPersisted: (updated: Block) => void;
  onSelectionAsk?: (sel: SelectionContext) => void;
}

function BlockEditor({ block, documentId, onPersisted, onSelectionAsk }: BlockEditorProps) {
  const runs: Run[] = ("runs" in block && Array.isArray(block.runs)) ? block.runs : [];
  const initialHtml = React.useMemo(() => runsToHtml(runs), [block.block_id]);
  const [savingState, setSavingState] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirtyRef = React.useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // single paragraph editor: deshabilitar features que confunden
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
      }),
      Underline,
      Highlight,
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "outline-none focus:bg-yellow-50/40 rounded px-1 transition-colors",
      },
    },
    onUpdate: () => {
      dirtyRef.current = true;
      setSavingState("idle");
    },
  });

  // Detectar selección de texto → emitir hacia el padre (SelectionAskBubble)
  // M19.17.A — incluir anchor_before/anchor_after para reemplazo no ambiguo en backend
  React.useEffect(() => {
    if (!editor || !onSelectionAsk) return;
    const handler = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) return;
      const text = editor.state.doc.textBetween(from, to, " ");
      if (text.trim().length < 3) return; // mínimo 3 chars
      const docSize = editor.state.doc.content.size;
      const anchorBeforeStart = Math.max(0, from - ANCHOR_CHARS);
      const anchorAfterEnd = Math.min(docSize, to + ANCHOR_CHARS);
      const anchor_before = editor.state.doc.textBetween(anchorBeforeStart, from, " ");
      const anchor_after = editor.state.doc.textBetween(to, anchorAfterEnd, " ");
      onSelectionAsk({
        block_id: block.block_id,
        text,
        from,
        to,
        anchor_before,
        anchor_after,
      });
    };
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("selectionUpdate", handler);
    };
  }, [editor, onSelectionAsk, block.block_id]);

  // Snapshot del block_data ANTES de cualquier edit (para el auditor)
  const beforeSnapshotRef = React.useRef<Record<string, unknown> | null>(null);
  React.useEffect(() => {
    beforeSnapshotRef.current = { ...(block as unknown as Record<string, unknown>) };
  }, [block.block_id]);

  // Persistir al perder foco
  const persist = React.useCallback(async () => {
    if (!editor || !dirtyRef.current) return;
    const html = editor.getHTML();
    const newRuns = htmlToRuns(html);
    setSavingState("saving");
    try {
      const res = await fetch(
        `/api/documents/v2/documents/${encodeURIComponent(documentId)}/blocks/${encodeURIComponent(block.block_id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            block_data: { ...(block as object), runs: newRuns },
            runs_only: true,
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      dirtyRef.current = false;
      setSavingState("saved");
      // Actualizar bloque en estado padre (también marca como local-edit
      // para que el guard de remount lo proteja durante la ventana)
      if (data?.block?.block_data) {
        onPersisted({ ...block, runs: data.block.block_data.runs } as Block);
      }
      // M19.17.D + C — notificar al canvas: refresca preview DOCX y dispara auditor
      window.dispatchEvent(
        new CustomEvent("lexai:doc-changed", {
          detail: {
            documentId,
            source: "inline-edit",
            edited_block_id: block.block_id,
            before_block_data: beforeSnapshotRef.current || undefined,
            user_instruction: "",
          },
        })
      );
      // Actualizar snapshot para la siguiente edición de este mismo bloque
      beforeSnapshotRef.current = { ...(block as unknown as Record<string, unknown>), runs: newRuns };
      // ocultar el "saved" después de 1.5s
      setTimeout(() => setSavingState("idle"), 1500);
    } catch (e) {
      console.error("block PATCH failed", e);
      setSavingState("error");
    }
  }, [editor, documentId, block, onPersisted]);

  if (!editor) {
    return <div className="text-zinc-400 italic">Cargando editor…</div>;
  }

  return (
    <div className="relative group" onBlur={persist}>
      <EditorContent editor={editor} />
      {savingState !== "idle" && (
        <span
          className={`absolute -right-1 top-0 text-[10px] px-1.5 py-0.5 rounded pointer-events-none ${
            savingState === "saving"
              ? "text-zinc-400"
              : savingState === "saved"
                ? "text-emerald-600"
                : "text-red-500"
          }`}
        >
          {savingState === "saving" ? "guardando…" : savingState === "saved" ? "✓ guardado" : "✗ error"}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Canvas principal
// ============================================================

// M19.17.D — ventana de "edit local en vuelo" para evitar remount mientras
// el usuario está escribiendo. Si el blockId está en este set, NO se remonta
// aunque cambie lastEditAt externo.
const LOCAL_EDIT_GUARD_MS = 2500;

export function EditableDocxCanvas({ blocks, documentId, onSelectionAsk, lastEditAt }: Props) {
  // Estado local de bloques (para reflejar ediciones optimistically)
  const [localBlocks, setLocalBlocks] = React.useState<Block[]>(blocks);
  // M19.17.D — last local edit timestamp por block_id (anti-clobber)
  const localEditTsRef = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  const updateBlock = React.useCallback((updated: Block) => {
    setLocalBlocks((prev) =>
      prev.map((b) => (b.block_id === updated.block_id ? updated : b))
    );
    localEditTsRef.current.set(updated.block_id, Date.now());
  }, []);

  // M19.17.D — calcula key del editor por bloque: si el bloque fue editado
  // localmente en los últimos LOCAL_EDIT_GUARD_MS, NO incluye lastEditAt
  // (preservando el editor del usuario). En cualquier otro caso, sí incluye
  // lastEditAt para forzar remount con el contenido actualizado del servidor.
  const editorKeyFor = React.useCallback(
    (blockId: string): string => {
      const lastLocal = localEditTsRef.current.get(blockId) || 0;
      const isFresh = Date.now() - lastLocal < LOCAL_EDIT_GUARD_MS;
      if (isFresh) return blockId; // proteger edición en curso
      return `${blockId}:${lastEditAt ?? 0}`;
    },
    [lastEditAt]
  );

  return (
    <div className="relative h-full overflow-y-auto bg-zinc-100">
      <div
        className="mx-auto bg-white shadow-md border border-zinc-200 my-6"
        style={{
          width: "8.5in",
          minHeight: "11in",
          padding: "1in",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "11pt",
          lineHeight: 1.15,
          color: "#000",
        }}
      >
        {localBlocks.length === 0 && (
          <div className="text-center text-zinc-400 py-20">
            <p className="text-sm">Documento vacío.</p>
          </div>
        )}
        {localBlocks.map((block) => {
          const isEditable = EDITABLE_BLOCK_TYPES.has(block.type);
          if (!isEditable) {
            // Read-only: BlockRenderer + key con lastEditAt para reflejar cambios
            // externos (tablas, citas, firma editadas vía chat)
            return (
              <div key={editorKeyFor(block.block_id)} className="select-text">
                <BlockRenderer block={block} />
              </div>
            );
          }
          return (
            <EditableBlockWrapper key={`wrap:${block.block_id}`} block={block}>
              <BlockEditor
                key={editorKeyFor(block.block_id)}
                block={block as Block & { runs?: Run[] }}
                documentId={documentId}
                onPersisted={updateBlock}
                onSelectionAsk={onSelectionAsk}
              />
            </EditableBlockWrapper>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Wrapper visual por tipo de bloque editable
// ============================================================

function EditableBlockWrapper({
  block,
  children,
}: {
  block: Block;
  children: React.ReactNode;
}) {
  // Layout específico por tipo (prefijos numéricos, etc.) — manteniendo simétrico al BlockRenderer
  switch (block.type) {
    case "hecho": {
      const num = (block as { num: number }).num;
      return (
        <div className="flex gap-2 mb-2 leading-relaxed text-justify">
          <span className="font-bold min-w-[2rem] text-right">{num}.</span>
          <div className="flex-1">{children}</div>
        </div>
      );
    }
    case "pretension": {
      const ord = (block as { ord: string }).ord;
      return (
        <div className="mb-3 leading-relaxed text-justify">
          <span className="font-bold">{ord}.</span>{" "}
          <span className="inline-block w-full">{children}</span>
        </div>
      );
    }
    case "list_item": {
      const num = (block as { num: string }).num;
      return (
        <div className="flex gap-2 mb-1 leading-relaxed pl-6 text-justify">
          <span className="font-bold min-w-[1.5rem]">{num})</span>
          <div className="flex-1">{children}</div>
        </div>
      );
    }
    case "subsection": {
      const number = (block as { number: string; text: string }).number;
      const text = (block as { number: string; text: string }).text;
      // subsection no tiene runs editables (header), mejor renderlo read-only
      return (
        <h3 className="text-sm font-bold underline mt-4 mb-2">
          {number}. {text}
        </h3>
      );
    }
    case "paragraph":
    default:
      return <div className="leading-relaxed text-justify mb-2">{children}</div>;
  }
}
