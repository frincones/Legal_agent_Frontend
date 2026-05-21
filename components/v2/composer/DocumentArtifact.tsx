'use client';

/**
 * F3-T09 · LexAI UX v2 — DocumentArtifact
 *
 * Card prominente que se renderiza debajo del bubble del agente cuando
 * el backend retorna un bloque <plantilla-doc>...</plantilla-doc>.
 *
 * Acciones:
 *   - "Abrir en canvas": llama a POST /api/canvas/draft y navega a /v2/canvas/[docId]
 *     o, si el backend retorna un draft base64, navega con query param ?draft=<base64>.
 *   - "Copiar texto": copia el contenido crudo al portapapeles.
 *
 * El contenido se pre-visualiza con las primeras 4 líneas no vacías.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ExternalLink, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface DocumentArtifactProps {
  content: string;
}

/** Extrae las primeras N líneas no vacías del contenido + strip de markdown
 *  básico (**, __, ##, etc.) para evitar que asteriscos crudos se vean en el
 *  preview. El documento completo se renderiza correctamente en TipTap al abrir
 *  en canvas. */
function getPreviewLines(content: string, maxLines = 4): string {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, maxLines)
    .map((l) =>
      l
        .replace(/^#{1,6}\s+/g, '') // headers ##, ###...
        .replace(/\*\*(.+?)\*\*/g, '$1') // **bold**
        .replace(/__(.+?)__/g, '$1') // __bold__
        .replace(/\*(.+?)\*/g, '$1') // *italic*
        .replace(/_(.+?)_/g, '$1') // _italic_
        .replace(/`([^`]+)`/g, '$1') // `code`
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), // [text](url)
    )
    .join('\n');
}

export function DocumentArtifact({ content }: DocumentArtifactProps) {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const [copied, setCopied] = useState(false);

  const preview = getPreviewLines(content);

  const handleOpenCanvas = useCallback(async () => {
    setIsOpening(true);
    try {
      const res = await fetch('/api/canvas/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content, title: 'Documento generado por LexAI' }),
      });

      if (!res.ok) {
        toast.error('No se pudo abrir el canvas. Intente de nuevo.');
        return;
      }

      const data = await res.json() as { docId?: string; draft?: string };

      if (data.docId) {
        // Backend creó el documento — navegar a la ruta permanente
        router.push(`/v2/canvas/${data.docId}`);
      } else if (data.draft) {
        // Stub: navegar con contenido base64 en query param
        router.push(`/v2/canvas/draft?content=${data.draft}`);
      } else {
        toast.error('Respuesta inesperada del servidor.');
      }
    } catch {
      toast.error('Error de red al abrir el canvas.');
    } finally {
      setIsOpening(false);
    }
  }, [content, router]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Texto copiado al portapapeles.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el texto.');
    }
  }, [content]);

  return (
    <div
      style={{
        marginTop: 8,
        borderRadius: 10,
        border: '1px solid var(--v2-border-subtle, #E8E7E1)',
        backgroundColor: 'var(--v2-bg-base, #FAFAF7)',
        overflow: 'hidden',
        maxWidth: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderBottom: '1px solid var(--v2-border-subtle, #E8E7E1)',
          backgroundColor: 'var(--v2-bg-subtle, #F2F1EC)',
        }}
      >
        <FileText
          size={15}
          style={{ color: 'var(--v2-accent-copper, #B8763C)', flexShrink: 0 }}
          aria-hidden
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--v2-text-primary, #1A1916)',
            fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
          }}
        >
          Documento generado
        </span>
      </div>

      {/* Preview */}
      {preview && (
        <div
          style={{
            padding: '10px 14px',
            fontSize: 12,
            lineHeight: 1.6,
            color: 'var(--v2-text-secondary, #4A4944)',
            fontFamily: 'Georgia, serif',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            maxHeight: 80,
            borderBottom: '1px solid var(--v2-border-subtle, #E8E7E1)',
          }}
        >
          {preview}
          {content.split('\n').filter(Boolean).length > 4 && (
            <span style={{ color: 'var(--v2-text-tertiary, #807E76)' }}>{'\n'}…</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
        }}
      >
        {/* Abrir en canvas — acción primaria */}
        <button
          onClick={handleOpenCanvas}
          disabled={isOpening}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 6,
            border: 'none',
            cursor: isOpening ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: 'var(--v2-brand-navy, #0E2A5E)',
            color: '#fff',
            opacity: isOpening ? 0.7 : 1,
            transition: 'opacity 0.15s',
            fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
          }}
          aria-label="Abrir documento en canvas de edición"
        >
          {isOpening ? (
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} aria-hidden />
          ) : (
            <ExternalLink size={12} aria-hidden />
          )}
          {isOpening ? 'Abriendo…' : 'Abrir en canvas'}
        </button>

        {/* Copiar texto — acción secundaria */}
        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid var(--v2-border-subtle, #E8E7E1)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: 'transparent',
            color: 'var(--v2-text-secondary, #4A4944)',
            fontFamily: 'var(--v2-font-sans, system-ui, sans-serif)',
            transition: 'background-color 0.15s',
          }}
          aria-label="Copiar texto del documento"
        >
          {copied ? (
            <Check size={12} style={{ color: 'var(--v2-ok, #22863a)' }} aria-hidden />
          ) : (
            <Copy size={12} aria-hidden />
          )}
          {copied ? 'Copiado' : 'Copiar texto'}
        </button>
      </div>
    </div>
  );
}
