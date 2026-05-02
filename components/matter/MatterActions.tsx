'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';

const SAVED_KEY = 'lexai:matters:saved';

function readSaved(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSaved(set: Set<string>): void {
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export function MatterActions({ matterId, canvasHref }: { matterId: string; canvasHref: string }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setSaved(readSaved().has(matterId));
  }, [matterId]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Máximo 25 MB por archivo.');
      return;
    }
    if (!/\.(pdf|docx?|txt)$/i.test(file.name)) {
      toast.error('Formato no soportado. Usa PDF, DOC/DOCX o TXT.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('matter_id', matterId);
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt.slice(0, 160) || `Upload falló (${res.status})`);
      }
      toast.success(`${file.name} subido. OCR en proceso.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error subiendo archivo';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggleSave = () => {
    const set = readSaved();
    if (set.has(matterId)) {
      set.delete(matterId);
      setSaved(false);
      toast('Caso desmarcado');
    } else {
      set.add(matterId);
      setSaved(true);
      toast.success('Caso guardado en favoritos');
    }
    writeSaved(set);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="btn"
        title="Subir documento al expediente"
      >
        {Ic.upload} {uploading ? 'Subiendo…' : 'Subir'}
      </button>
      <button
        type="button"
        onClick={toggleSave}
        className="btn"
        title={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      >
        {Ic.bookmark} {saved ? 'Guardado' : 'Guardar'}
      </button>
      <Link href={canvasHref} className="btn btn-primary">
        {Ic.bolt} Trabajar en Canvas
      </Link>
    </>
  );
}
