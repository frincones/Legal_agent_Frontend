"use client";

/**
 * M19.16.F3 — Canvas con flujo Harvey-style:
 *   status === "running"   → BlockRenderer en streaming (read-only, "teatro" en vivo)
 *   status === "completed" → EditableDocxCanvas (TipTap por bloque, click-to-edit)
 *
 * El botón "Vista final (DOCX)" sigue disponible como secondary action vía
 * DocxPreviewCanvas (renderizado fiel del .docx). El usuario alterna entre
 * Editor (default) y Vista final.
 */

import * as React from "react";
import type { Block } from "@/lib/types/blocks";
import { BlockRenderer } from "./BlockRenderer";
import { DocxPreviewCanvas } from "./DocxPreviewCanvas";
import { EditableDocxCanvas, type SelectionContext } from "./EditableDocxCanvas";
import { SelectionAskBubble } from "./SelectionAskBubble";

interface Props {
  blocks: Block[];
  status: "idle" | "running" | "completed" | "error";
  documentId?: string | null;
  onSelectionAsk?: (selection: SelectionContext) => void;
  /** M19.17.D — timestamp del último REPLACE_BLOCKS (remount fino) */
  lastEditAt?: number | null;
  /** M19.17.D — true mientras hay refresh de bloques en vuelo */
  isSyncing?: boolean;
}

type ViewMode = "editor" | "preview";

export function ForensicCanvas({
  blocks,
  status,
  documentId,
  onSelectionAsk,
  lastEditAt,
  isSyncing,
}: Props) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("editor");
  const [activeSelection, setActiveSelection] = React.useState<SelectionContext | null>(null);

  const handleSelection = React.useCallback(
    (sel: SelectionContext) => {
      setActiveSelection(sel);
      onSelectionAsk?.(sel);
    },
    [onSelectionAsk]
  );

  const completed = status === "completed" && Boolean(documentId);

  return (
    <div className="relative h-full overflow-hidden flex flex-col bg-white">
      {/* Toolbar mini: solo visible cuando completado */}
      {completed && (
        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-1.5 bg-zinc-50 flex-shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`px-3 py-1 text-xs rounded transition ${
                viewMode === "editor"
                  ? "bg-white shadow-sm border border-zinc-200 font-medium text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
              title="Edita inline cualquier párrafo. Cambios se guardan automáticamente."
            >
              ✏ Editor
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1 text-xs rounded transition ${
                viewMode === "preview"
                  ? "bg-white shadow-sm border border-zinc-200 font-medium text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
              title="Renderizado fiel del .docx final (read-only)"
            >
              📄 Vista final (DOCX)
            </button>
          </div>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1.5">
            {isSyncing && (
              <span className="inline-flex items-center gap-1 text-blue-600">
                <span
                  className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"
                  aria-hidden
                />
                sincronizando…
              </span>
            )}
            {!isSyncing && (
              <>
                {viewMode === "editor"
                  ? "Edita inline · selecciona texto para pedir cambios a LexAI"
                  : "Idéntico al archivo descargable"}
              </>
            )}
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {/* Streaming: render aproximado de bloques que van llegando */}
        {!completed && (
          <div
            className="mx-auto max-w-3xl my-6 px-12 py-10 bg-white shadow-md border border-zinc-200"
            style={{ minHeight: "calc(100vh - 8rem)" }}
          >
            {blocks.length === 0 && status === "idle" && (
              <div className="text-center text-zinc-400 py-20">
                <p className="text-lg">El documento aparecerá aquí</p>
                <p className="text-sm mt-2">
                  Escribe el intent y presiona Generar para empezar.
                </p>
              </div>
            )}
            {blocks.length === 0 && status === "running" && (
              <div className="text-center text-zinc-400 py-20 animate-pulse">
                <p className="text-sm">Preparando documento…</p>
              </div>
            )}
            {blocks.map((block) => (
              <BlockRenderer key={block.block_id} block={block} />
            ))}
            {status === "running" && blocks.length > 0 && (
              <span
                className="inline-block w-2 h-4 bg-zinc-800 animate-pulse ml-1"
                aria-hidden
              />
            )}
          </div>
        )}

        {/* Completado: editor inline o preview final */}
        {completed && viewMode === "editor" && (
          <EditableDocxCanvas
            blocks={blocks}
            documentId={documentId as string}
            onSelectionAsk={handleSelection}
            lastEditAt={lastEditAt ?? null}
          />
        )}
        {completed && viewMode === "preview" && (
          <DocxPreviewCanvas documentId={documentId as string} />
        )}

        {/* Popover de selección — Harvey/ChatGPT-Canvas style */}
        {completed && viewMode === "editor" && activeSelection && (
          <SelectionAskBubble
            selection={activeSelection}
            documentId={documentId as string}
            onDismiss={() => setActiveSelection(null)}
          />
        )}
      </div>
    </div>
  );
}
