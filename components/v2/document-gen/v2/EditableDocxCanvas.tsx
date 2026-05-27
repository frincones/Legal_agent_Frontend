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
}

export interface SelectionContext {
  block_id: string;
  text: string;
  // posición opcional dentro del bloque (para reemplazar después)
  from?: number;
  to?: number;
}

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
  React.useEffect(() => {
    if (!editor || !onSelectionAsk) return;
    const handler = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) return;
      const text = editor.state.doc.textBetween(from, to, " ");
      if (text.trim().length < 3) return; // mínimo 3 chars
      onSelectionAsk({ block_id: block.block_id, text, from, to });
    };
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("selectionUpdate", handler);
    };
  }, [editor, onSelectionAsk, block.block_id]);

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
      // Actualizar bloque en estado padre
      if (data?.block?.block_data) {
        onPersisted({ ...block, runs: data.block.block_data.runs } as Block);
      }
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

export function EditableDocxCanvas({ blocks, documentId, onSelectionAsk }: Props) {
  // Estado local de bloques (para reflejar ediciones optimistically)
  const [localBlocks, setLocalBlocks] = React.useState<Block[]>(blocks);

  React.useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  const updateBlock = React.useCallback((updated: Block) => {
    setLocalBlocks((prev) =>
      prev.map((b) => (b.block_id === updated.block_id ? updated : b))
    );
  }, []);

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
            // Read-only: usar BlockRenderer existente para chips/tablas/headings/firma
            return (
              <div key={block.block_id} className="select-text">
                <BlockRenderer block={block} />
              </div>
            );
          }
          return (
            <EditableBlockWrapper key={block.block_id} block={block}>
              <BlockEditor
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
