'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { exportHtmlAsDocx } from '@/lib/docx/exportFromTipTap';

/**
 * Top-bar action that exports the current canvas document to .docx.
 *
 * Source of truth = the latest persisted version on Supabase (fetched
 * via /api/matter-documents/canvas). This guarantees we export exactly
 * what would be reloaded later, instead of a transient editor buffer.
 */
export function ExportDocxButton({
  matterId,
  matterTitle,
  matterMateria,
  matterTribunal,
  className = 'btn',
}: {
  matterId: string;
  matterTitle?: string;
  matterMateria?: string;
  matterTribunal?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const handleExport = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const t = toast.loading('Exportando a Word…');
    try {
      const res = await fetch(`/api/matter-documents/canvas?matter_id=${encodeURIComponent(matterId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`No se pudo cargar el documento (${res.status})`);
      }
      const data = (await res.json()) as { html?: string; titulo?: string };
      const html = (data.html ?? '').trim();
      if (!html) {
        toast.dismiss(t);
        toast.error('El documento está vacío. Escribe algo en el canvas antes de exportar.');
        return;
      }
      const subtitleParts = [matterMateria, matterTribunal].filter(Boolean) as string[];
      const { filename } = await exportHtmlAsDocx(html, {
        title: matterTitle ?? data.titulo ?? 'Documento',
        subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined,
      });
      toast.dismiss(t);
      toast.success(`Descargado: ${filename}`);
    } catch (e) {
      toast.dismiss(t);
      const msg = e instanceof Error ? e.message : 'Error exportando a Word';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }, [busy, matterId, matterTitle, matterMateria, matterTribunal]);

  return (
    <button
      type="button"
      className={className}
      onClick={handleExport}
      disabled={busy}
      aria-label="Exportar a Word"
      title="Exportar el canvas a un archivo .docx"
    >
      {Ic.download}
      {busy ? 'Exportando…' : 'Export .docx'}
    </button>
  );
}
