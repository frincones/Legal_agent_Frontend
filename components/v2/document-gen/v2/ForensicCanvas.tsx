"use client";

import * as React from "react";
import type { Block } from "@/lib/types/blocks";
import { BlockRenderer } from "./BlockRenderer";
import { DocxPreviewCanvas } from "./DocxPreviewCanvas";

interface Props {
  blocks: Block[];
  status: "idle" | "running" | "completed" | "error";
  documentId?: string | null;
}

type ViewMode = "stream" | "final";

export function ForensicCanvas({ blocks, status, documentId }: Props) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("stream");
  const autoSwitchedRef = React.useRef(false);

  // M19.14.D: al completar la generación, auto-switch a Vista final UNA sola vez
  // (luego el usuario puede volver a Stream manualmente si quiere ver los bloques).
  React.useEffect(() => {
    if (status === "completed" && documentId && !autoSwitchedRef.current) {
      autoSwitchedRef.current = true;
      setViewMode("final");
    }
    if (status === "running") {
      autoSwitchedRef.current = false;
      setViewMode("stream");
    }
  }, [status, documentId]);

  const showToggle = Boolean(documentId) && status === "completed";

  return (
    <div className="relative h-full overflow-hidden flex flex-col bg-white">
      {showToggle && (
        <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-1.5 bg-zinc-50 flex-shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("stream")}
              className={`px-3 py-1 text-xs rounded transition ${
                viewMode === "stream"
                  ? "bg-white shadow-sm border border-zinc-200 font-medium text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
              title="Vista de bloques en vivo (como se generó)"
            >
              📝 Vista en vivo
            </button>
            <button
              type="button"
              onClick={() => setViewMode("final")}
              className={`px-3 py-1 text-xs rounded transition ${
                viewMode === "final"
                  ? "bg-white shadow-sm border border-zinc-200 font-medium text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
              title="Vista del archivo .docx final (idéntico al que se descarga)"
            >
              📄 Vista final (DOCX)
            </button>
          </div>
          <span className="text-[10px] text-zinc-400">
            {viewMode === "final" ? "Renderizado fiel del .docx" : "Vista aproximada"}
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        {viewMode === "final" && documentId ? (
          <DocxPreviewCanvas documentId={documentId} />
        ) : (
          <div
            className="mx-auto max-w-3xl my-6 px-12 py-10 bg-white shadow-md border border-zinc-200"
            style={{ minHeight: "calc(100vh - 8rem)" }}
          >
            {blocks.length === 0 && status === "idle" && (
              <div className="text-center text-zinc-400 py-20">
                <p className="text-lg">El documento aparecerá aquí</p>
                <p className="text-sm mt-2">Escribe el intent y presiona Generar para empezar.</p>
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
      </div>
    </div>
  );
}
