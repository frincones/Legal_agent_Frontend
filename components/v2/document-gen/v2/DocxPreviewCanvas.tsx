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

// M19.17.D — debounce para evitar fetch-storm si llegan varios "doc-changed" seguidos
const REFETCH_DEBOUNCE_MS = 800;

export function DocxPreviewCanvas({ documentId }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  // M19.17.D — incrementar para forzar re-fetch sin desmontar el componente
  const [revision, setRevision] = React.useState(0);

  // M19.17.D — listener del evento global lexai:doc-changed (edits inline o chat)
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as { documentId?: string } | undefined;
      // Solo reaccionar si el evento es para este documento (o sin documentId → asumir match)
      if (detail?.documentId && detail.documentId !== documentId) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setRevision((r) => r + 1), REFETCH_DEBOUNCE_MS);
    };
    window.addEventListener("lexai:doc-changed", handler as EventListener);
    return () => {
      window.removeEventListener("lexai:doc-changed", handler as EventListener);
      if (timer) clearTimeout(timer);
    };
  }, [documentId]);

  React.useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // M19.17.D — cache-buster para garantizar fresh download tras edits
        const cacheBuster = revision > 0 ? `?v=${revision}` : "";
        const url = `/api/documents/v2/documents/${encodeURIComponent(documentId)}/export-forensic${cacheBuster}`;
        const res = await fetch(url, { credentials: "include", cache: "no-store" });
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
  }, [documentId, revision]);

  return (
    <div className="relative h-full overflow-y-auto bg-zinc-100">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center text-zinc-500 animate-pulse bg-white/80 px-4 py-2 rounded shadow">
            <p className="text-sm">
              {revision === 0 ? "Renderizando documento final…" : "Actualizando vista final…"}
            </p>
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
