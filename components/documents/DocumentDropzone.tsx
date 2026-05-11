'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle2, FileText, Loader2, Upload, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Status = 'idle' | 'uploading' | 'done' | 'error';
type FileState = {
  id: string;
  file: File;
  status: Status;
  message?: string;
  documentId?: string;
};

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'text/plain': ['.txt'],
};

const MAX_BYTES = 25 * 1024 * 1024;

export function DocumentDropzone({
  matterId,
  onUploaded,
  className,
}: {
  matterId: string;
  onUploaded?: (documentId: string) => void;
  className?: string;
}) {
  const [files, setFiles] = useState<FileState[]>([]);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length) return;
      const next: FileState[] = accepted.map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
        status: 'idle',
      }));
      setFiles((prev) => [...prev, ...next]);
      // Upload in serial to avoid hammering the backend on big files.
      for (const item of next) {
        await uploadOne(item.id, item.file);
      }
    },
    [matterId],
  );

  async function uploadOne(id: string, file: File) {
    setFiles((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'uploading' } : p)));
    try {
      if (file.size > MAX_BYTES) throw new Error('archivo > 25 MB');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('matter_id', matterId);
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt.slice(0, 200) || `Error ${res.status}`);
      }
      const data = await res.json();
      const documentId = data.document_id || data.id;
      setFiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'done',
                documentId,
                message: 'Subido. OCR + análisis en progreso.',
              }
            : p,
        ),
      );
      toast.success(`${file.name} subido`);
      onUploaded?.(documentId);
    } catch (e) {
      setFiles((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'error', message: e instanceof Error ? e.message : 'Error' }
            : p,
        ),
      );
      toast.error(`No pude subir ${file.name}`);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: true,
    maxSize: MAX_BYTES,
  });

  return (
    <div className={cn('grid gap-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'rounded-md border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
          isDragActive
            ? 'border-accent bg-accent/5 text-accent'
            : 'border-line hover:border-accent hover:bg-bg-elev',
        )}
      >
        <input {...getInputProps()} />
        <Upload size={20} className="mx-auto" aria-hidden="true" />
        <div className="mt-2 text-[13px] font-semibold">
          {isDragActive ? 'Suelta los archivos…' : 'Arrastra documentos aquí o haz click'}
        </div>
        <div className="text-[11.5px] muted">
          PDF · DOCX · JPG · PNG · HEIC · TXT · hasta 25 MB · OCR automático
        </div>
      </div>
      {files.length > 0 && (
        <ul className="grid gap-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded-md border border-line bg-bg-elev p-2.5"
            >
              <FileText size={14} className="text-accent" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold">{f.file.name}</div>
                <div className="text-[11px] muted">
                  {(f.file.size / 1024).toFixed(1)} KB
                  {f.message ? ` · ${f.message}` : ''}
                </div>
              </div>
              {f.status === 'uploading' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {f.status === 'done' && <CheckCircle2 size={14} className="text-emerald-500" aria-hidden="true" />}
              {f.status === 'error' && <XCircle size={14} className="text-red-500" aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
