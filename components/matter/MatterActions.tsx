'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CalendarPlus, FolderPlus, FileSignature, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { AudienciaModal } from '@/components/casos/AudienciaModal';
import { CloudPicker } from '@/components/cloud/CloudPicker';
import { DocuSignEnvelopeModal } from '@/components/docusign/DocuSignEnvelopeModal';
import { SlashCommandPalette } from '@/components/chat/SlashCommandPalette';
import { SkillResultModal, type SkillResultData } from '@/components/skills/SkillResultModal';

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

export function MatterActions({
  matterId,
  canvasHref,
  matterTitulo,
  clientEmail,
}: {
  matterId: string;
  canvasHref: string;
  matterTitulo?: string;
  clientEmail?: string | null;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audienciaOpen, setAudienciaOpen] = useState(false);
  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [docuSignOpen, setDocuSignOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [skillResult, setSkillResult] = useState<SkillResultData | null>(null);
  const [skillRunning, setSkillRunning] = useState(false);

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
      <button
        type="button"
        onClick={() => setAudienciaOpen(true)}
        className="btn"
        title="Agendar audiencia o reunión"
      >
        <CalendarPlus size={14} /> Audiencia
      </button>
      <button
        type="button"
        onClick={() => setCloudPickerOpen(true)}
        className="btn"
        title="Vincular carpeta de Drive/OneDrive/Dropbox al caso"
      >
        <FolderPlus size={14} /> Vincular nube
      </button>
      <button
        type="button"
        onClick={() => setDocuSignOpen(true)}
        className="btn"
        title="Enviar documento a firma DocuSign"
      >
        <FileSignature size={14} /> Firma
      </button>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="btn"
        title="Skills LexAI (Cmd+K)"
      >
        <Sparkles size={14} /> Skills
      </button>
      <Link href={canvasHref} className="btn btn-primary">
        {Ic.bolt} Trabajar en Canvas
      </Link>
      <AudienciaModal
        matterId={matterId}
        matterTitulo={matterTitulo}
        clientEmail={clientEmail}
        open={audienciaOpen}
        onOpenChange={setAudienciaOpen}
      />
      <CloudPicker
        matterId={matterId}
        open={cloudPickerOpen}
        onOpenChange={setCloudPickerOpen}
      />
      <DocuSignEnvelopeModal
        matterId={matterId}
        open={docuSignOpen}
        onOpenChange={setDocuSignOpen}
        defaultTitle={matterTitulo ? `Firma · ${matterTitulo}` : ''}
        defaultSigners={
          clientEmail ? [{ name: '', email: clientEmail, routing_order: 1 }] : undefined
        }
      />
      <SlashCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        matterId={matterId}
        onSkillSelected={async (skill, palettePrompt) => {
          if (skillRunning) return;
          // Si el skill es de drafting y no hay prompt, pedirlo explícito.
          let userPrompt = palettePrompt?.trim() || '';
          if (skill.command.startsWith('/redactar') && !userPrompt) {
            const requested = window.prompt(
              `${skill.name}\n\nDescribe brevemente qué necesitas (partes, monto, plazo, condiciones…):`,
              '',
            );
            if (requested === null) return; // cancelado
            userPrompt = requested.trim();
            if (!userPrompt) {
              toast.error('Necesito una descripción para redactar');
              return;
            }
          }
          setSkillRunning(true);
          const toastId = toast.loading(`Ejecutando ${skill.name}…`, {
            description: skill.command,
          });
          try {
            const r = await fetch('/api/skills/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                command: skill.command,
                matter_id: matterId,
                input: { matter_titulo: matterTitulo, prompt: userPrompt },
              }),
            });
            if (r.ok) {
              const data = await r.json();
              toast.dismiss(toastId);
              setSkillResult({ ...data, skill_name: skill.name });
            } else {
              const body = await r.json().catch(() => ({}));
              toast.dismiss(toastId);
              toast.error(body?.detail?.reason || `Error ${r.status}`);
            }
          } catch (e: any) {
            toast.dismiss(toastId);
            toast.error(e?.message || 'Error');
          } finally {
            setSkillRunning(false);
          }
        }}
      />
      <SkillResultModal
        data={skillResult}
        matterId={matterId}
        open={!!skillResult}
        onOpenChange={(o) => !o && setSkillResult(null)}
      />
    </>
  );
}
