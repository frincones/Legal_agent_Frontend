'use client';

/**
 * F4-T06 · SectionDocumentos — Documentos del caso.
 * Estrategia: REESCRITA con tokens v2.
 * Reutiliza DocumentDropzone y DocumentRowActions.
 */

import { cn, formatRelative } from '@/lib/utils';
import { DocumentDropzone } from '@/components/documents/DocumentDropzone';
import { DocumentRowActions } from '@/components/matter/DocumentRowActions';
import { FileText } from 'lucide-react';

interface Doc {
  id: string;
  kind: string;
  titulo: string;
  status: string;
  pages: number | null;
  byte_size: number | null;
  created_at: string;
  resumen_ia: string | null;
}

interface Props {
  matterId: string;
  documentos: Doc[];
}

export function SectionDocumentos({ matterId, documentos }: Props) {
  return (
    <div className="space-y-4">
      <DocumentDropzone matterId={matterId} />

      {documentos.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
          Aún no hay documentos. Sube el primero con el botón de arriba.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--v2-bg-muted, #E8E7E1)' }}>
          {documentos.map((d) => (
            <div key={d.id} className="flex items-start gap-3 py-3">
              <span
                className="grid h-9 w-9 flex-none place-items-center rounded-lg"
                style={{ background: 'var(--v2-bg-subtle, #F2F1EC)', color: 'var(--v2-text-secondary, #4A4944)' }}
              >
                <FileText size={16} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                  {d.titulo}
                </div>
                <div className="text-[11.5px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                  {d.kind.toUpperCase()} · {d.pages ?? 0} págs ·{' '}
                  {d.byte_size ? `${Math.round(d.byte_size / 1024)} KB` : '—'} · {formatRelative(d.created_at)}
                </div>
                {d.resumen_ia && (
                  <div className="mt-1 line-clamp-2 text-[12px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                    {d.resumen_ia}
                  </div>
                )}
              </div>
              <div className="flex flex-none items-center gap-2">
                <DocumentRowActions
                  documentId={d.id}
                  documentTitle={d.titulo}
                  documents={documentos.map((x) => ({ id: x.id, titulo: x.titulo }))}
                />
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10.5px] font-medium',
                    d.status === 'verificado'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700',
                  )}
                >
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
