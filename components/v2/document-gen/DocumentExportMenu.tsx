'use client';

/**
 * components/v2/document-gen/DocumentExportMenu.tsx
 *
 * Dropdown de exportacion del documento generado.
 * Opciones: PDF judicial / Word (.docx) / copiar texto / generar link compartible.
 */

import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Download, FileText, FileType2, Copy, Link2, Printer, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export type ExportFormat = 'pdf' | 'docx' | 'copy' | 'link' | 'print';

export interface DocumentExportMenuProps {
  documentId: string;
  documentTitle?: string;
  documentMd?: string;
  onExport?: (format: ExportFormat) => Promise<void> | void;
}

export function DocumentExportMenu({
  documentId,
  documentTitle,
  documentMd,
  onExport,
}: DocumentExportMenuProps) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(format);

    try {
      // Acciones cliente puras (no requieren backend)
      if (format === 'copy' && documentMd) {
        await navigator.clipboard.writeText(documentMd);
        toast.success('Documento copiado al portapapeles');
        return;
      }

      if (format === 'print') {
        window.print();
        return;
      }

      // Acciones que requieren backend
      if (onExport) {
        await onExport(format);
        return;
      }

      // Fallback: llamar endpoint proxy
      const res = await fetch(`/api/documents/${documentId}/export?format=${format}`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error(`Export failed (${res.status})`);

      if (format === 'link') {
        const data = await res.json();
        if (data.url) {
          await navigator.clipboard.writeText(data.url);
          toast.success('Link copiado al portapapeles');
        }
        return;
      }

      // PDF / DOCX: descarga directa
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle ?? 'documento'}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Descargado como ${format.toUpperCase()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al exportar: ${msg}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--v2-brand-navy, #0E2A5E)' }}
        >
          <Download size={13} aria-hidden />
          Exportar
          <ChevronDown size={11} aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[220px] rounded-lg border bg-white p-1 shadow-lg"
          style={{ borderColor: 'var(--v2-border-default, #D4D2CA)' }}
        >
          <div
            className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--v2-text-tertiary, #807E76)' }}
          >
            Exportar documento
          </div>

          <DropdownMenu.Item
            onSelect={() => void handleExport('pdf')}
            disabled={isExporting === 'pdf'}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[12px] outline-none transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)] disabled:opacity-50"
            style={{ color: 'var(--v2-text-primary, #1A1916)' }}
          >
            <FileText size={14} className="text-red-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="font-medium">PDF</div>
              <div className="text-[10px] text-[var(--v2-text-tertiary,#807E76)]">Formato judicial</div>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => void handleExport('docx')}
            disabled={isExporting === 'docx'}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[12px] outline-none transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)] disabled:opacity-50"
            style={{ color: 'var(--v2-text-primary, #1A1916)' }}
          >
            <FileType2 size={14} className="text-blue-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Word (.docx)</div>
              <div className="text-[10px] text-[var(--v2-text-tertiary,#807E76)]">Editable</div>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => void handleExport('copy')}
            disabled={isExporting === 'copy' || !documentMd}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[12px] outline-none transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)] disabled:opacity-50"
            style={{ color: 'var(--v2-text-primary, #1A1916)' }}
          >
            <Copy size={14} className="text-[var(--v2-text-tertiary,#807E76)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Copiar texto</div>
              <div className="text-[10px] text-[var(--v2-text-tertiary,#807E76)]">Markdown plano</div>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px" style={{ backgroundColor: 'var(--v2-border-subtle, #E8E7E1)' }} />

          <DropdownMenu.Item
            onSelect={() => void handleExport('link')}
            disabled={isExporting === 'link'}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[12px] outline-none transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)] disabled:opacity-50"
            style={{ color: 'var(--v2-text-primary, #1A1916)' }}
          >
            <Link2 size={14} className="text-[var(--v2-brand-navy,#0E2A5E)]" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Generar enlace</div>
              <div className="text-[10px] text-[var(--v2-text-tertiary,#807E76)]">Portal cliente</div>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => void handleExport('print')}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[12px] outline-none transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
            style={{ color: 'var(--v2-text-primary, #1A1916)' }}
          >
            <Printer size={14} className="text-[var(--v2-text-tertiary,#807E76)]" aria-hidden />
            <div className="font-medium">Imprimir</div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
