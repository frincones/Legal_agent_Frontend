"use client";

/**
 * M19.14.D — Renderiza el .docx forense REAL en el canvas usando docx-preview.
 *
 * A diferencia de BlockRenderer (que es una aproximación CSS de los bloques en
 * streaming), este componente fetchea el .docx generado por el backend y lo
 * renderiza fielmente con OOXML real. Lo que ve el usuario aquí ES el archivo
 * que descarga.
 *
 * Uso típico: tras `state.status === "completed"`, intercambiar el canvas de
 * streaming por <DocxPreviewCanvas documentId={state.documentId} />.
 */

import * as React from "react";

interface Props {
  documentId: string;
}

export function DocxPreviewCanvas({ documentId }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const url = `/api/documents/v2/documents/${encodeURIComponent(documentId)}/export-forensic`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error(`backend HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled || !containerRef.current) return;

        const { renderAsync } = await import("docx-preview");
        containerRef.current.innerHTML = "";
        await renderAsync(blob, containerRef.current, undefined, {
          className: "docx-preview-root",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
        });
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  return (
    <div className="relative h-full overflow-y-auto bg-zinc-100">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-zinc-500 animate-pulse">
            <p className="text-sm">Renderizando documento final…</p>
          </div>
        </div>
      )}
      {error && (
        <div className="text-center text-red-600 py-10 px-6 text-sm">
          <p>No se pudo renderizar el .docx: {error}</p>
          <p className="text-xs text-zinc-500 mt-2">
            Intenta descargar el archivo y abrirlo en Word.
          </p>
        </div>
      )}
      <div ref={containerRef} className="docx-preview-host" />
    </div>
  );
}
