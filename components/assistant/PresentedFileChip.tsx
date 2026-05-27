"use client";

/**
 * Sprint M19.7 · PresentedFileChip
 *
 * Chip especial estilo Claude para presentar un archivo generado por el
 * agente (ej. demanda.docx). Muestra:
 *  - Icono DOCX
 *  - Nombre del archivo
 *  - Tamaño + tipo
 *  - Botón Descargar
 *  - Preview thumbnail (si hay)
 *
 * Reusa el ToolCallDetail.response como metadata: { name, size_kb, url, preview_b64 }
 */

import * as React from "react";
import type { ToolCallDetail } from "@/lib/types/blocks";

interface Props {
  tool: ToolCallDetail;
  className?: string;
}

interface FileMeta {
  name?: string;
  size_kb?: number;
  url?: string;
  preview_b64?: string;
  mime?: string;
}

export function PresentedFileChip({ tool, className = "" }: Props) {
  const meta: FileMeta = (tool.response as FileMeta) || {};
  const name = meta.name || "documento.docx";
  const url = meta.url;
  const sizeKb = meta.size_kb;
  const previewB64 = meta.preview_b64;
  const isDocx = name.toLowerCase().endsWith(".docx") || (meta.mime || "").includes("wordprocessing");

  const [previewOpen, setPreviewOpen] = React.useState(false);

  return (
    <div
      className={`presented-file-chip flex items-center gap-3 px-3 py-2.5 my-2 border border-zinc-200 rounded-lg bg-white shadow-sm hover:shadow transition-shadow max-w-md ${className}`}
    >
      {/* Icon o thumbnail */}
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 44, height: 56 }}
      >
        {previewB64 ? (
          <img
            src={`data:image/png;base64,${previewB64}`}
            alt={`Vista previa de ${name}`}
            className="w-full h-full object-cover rounded border border-zinc-200 cursor-pointer"
            onClick={() => setPreviewOpen(true)}
          />
        ) : (
          <div
            className={`w-full h-full rounded flex flex-col items-center justify-center text-white font-bold text-[10px] ${
              isDocx ? "bg-blue-600" : "bg-zinc-500"
            }`}
            style={{ lineHeight: 1.2 }}
          >
            <span style={{ fontSize: 18 }}>📄</span>
            <span>{isDocx ? "DOCX" : "FILE"}</span>
          </div>
        )}
      </div>

      {/* Info + actions */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-zinc-800 truncate" title={name}>
          {name}
        </div>
        <div className="text-[11px] text-zinc-500 mt-0.5">
          Documento {isDocx ? "Word" : ""}{sizeKb ? ` · ${sizeKb} KB` : ""}
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1.5">
        {previewB64 && (
          <button
            onClick={() => setPreviewOpen(true)}
            className="text-[11px] px-2 py-1 border border-zinc-300 rounded hover:bg-zinc-50 text-zinc-700"
          >
            👁 Ver
          </button>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download={name}
            className="text-[11px] px-2.5 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800"
          >
            ↓ Descargar
          </a>
        )}
      </div>

      {/* Preview modal */}
      {previewOpen && previewB64 && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-8"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl max-h-[90vh] overflow-auto p-4 relative">
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-2 right-3 text-zinc-500 hover:text-zinc-800 text-xl"
              aria-label="Cerrar preview"
            >
              ×
            </button>
            <div className="text-sm font-semibold mb-2">{name}</div>
            <img
              src={`data:image/png;base64,${previewB64}`}
              alt={`Vista previa de ${name}`}
              className="max-w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
