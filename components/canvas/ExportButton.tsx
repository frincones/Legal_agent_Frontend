'use client';

import { useState } from 'react';
import { Download, Loader2, FileText, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import * as Dropdown from '@radix-ui/react-dropdown-menu';

export function ExportButton({
  contentMd,
  title,
  redlinesApplied = false,
}: {
  contentMd: string;
  title?: string;
  redlinesApplied?: boolean;
}) {
  const [exporting, setExporting] = useState<string | null>(null);

  async function exportAs(format: 'docx' | 'pdf' | 'md') {
    if (!contentMd?.trim()) {
      toast.error('Canvas vacío · escribe algo primero');
      return;
    }
    setExporting(format);
    try {
      const r = await fetch('/api/canvas/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_md: contentMd,
          title: title || 'Documento LexAI',
          author: 'LexAI',
          format,
          redlines_applied: redlinesApplied,
        }),
      });
      if (!r.ok) {
        toast.error(`Error ${r.status}`);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (title || 'documento').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
      a.download = `${safeTitle}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Descargado .${format}`);
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setExporting(null);
    }
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button type="button" className="btn" title="Exportar documento">
          <Download size={14} /> Exportar
        </button>
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content className="surface min-w-[180px] p-1 z-50" align="end">
          <Dropdown.Item
            className="flex items-center gap-2 px-3 py-2 text-[12.5px] cursor-pointer hover:bg-bg-2 rounded"
            onClick={() => exportAs('docx')}
            disabled={!!exporting}
          >
            {exporting === 'docx' ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
            Word (.docx)
          </Dropdown.Item>
          <Dropdown.Item
            className="flex items-center gap-2 px-3 py-2 text-[12.5px] cursor-pointer hover:bg-bg-2 rounded opacity-60"
            disabled
          >
            <FileText size={12} /> PDF (próximamente)
          </Dropdown.Item>
          <Dropdown.Item
            className="flex items-center gap-2 px-3 py-2 text-[12.5px] cursor-pointer hover:bg-bg-2 rounded"
            onClick={() => exportAs('md')}
            disabled={!!exporting}
          >
            {exporting === 'md' ? <Loader2 size={12} className="animate-spin" /> : <FileCode size={12} />}
            Markdown (.md)
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
