'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { useVoice } from '@/components/voice/VoiceProvider';

const SILENCED_KEY = 'lexai:greeting:silenced';

export function InicioTopActions() {
  const router = useRouter();
  const { toggle, micPermission } = useVoice();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const onPickFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    toast.info(`Selecciona un caso para vincular ${file.name}.`);
    router.push('/documentos?upload=1');
  };

  const onNuevoDictado = async () => {
    if (micPermission === 'denied') {
      toast.error('Permiso de micrófono denegado. Habilítalo en la barra del navegador.');
      return;
    }
    if (micPermission === 'unsupported') {
      toast.error('Tu navegador no soporta voz. Usa Chrome/Edge/Safari recientes.');
      return;
    }
    setBusy(true);
    try {
      await toggle();
      toast.success('Voz activa. Habla normal o pulsa Espacio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files)}
      />
      <Link href="/documentos" className="btn">
        <span className="inline-flex">{Ic.upload}</span> Subir documento
      </Link>
      <button type="button" onClick={() => void onNuevoDictado()} disabled={busy} className="btn btn-primary">
        <span className="inline-flex">{Ic.bolt}</span> {busy ? 'Activando…' : 'Nuevo dictado'}
      </button>
    </>
  );
}

export function GreetingActions({ matterId }: { matterId: string }) {
  const router = useRouter();
  const { toggle, micPermission } = useVoice();

  const onPreparar = async () => {
    // Open the case canvas where the lawyer can dictate alegatos via voice.
    router.push(`/casos/${matterId}/canvas`);
    if (micPermission === 'granted' || micPermission === 'prompt') {
      // Best-effort start voice on the canvas page.
      try { await toggle(); } catch { /* noop */ }
    }
  };

  const onSilenciar = () => {
    try {
      window.localStorage.setItem(SILENCED_KEY, String(Date.now()));
    } catch { /* ignore */ }
    toast('Saludo silenciado por hoy.');
    // Soft-hide the card without a full reload.
    document.getElementById('lexai-greeting')?.setAttribute('hidden', 'true');
  };

  return (
    <div className="mt-[14px] flex gap-2">
      <button type="button" onClick={() => void onPreparar()} className="btn btn-sm btn-primary">
        Sí, preparar alegatos
      </button>
      <Link href="/calendario" className="btn btn-sm">
        Ver agenda completa
      </Link>
      <button type="button" onClick={onSilenciar} className="btn btn-sm btn-ghost">
        Silenciar saludo
      </button>
    </div>
  );
}

export function UrgentCardActions({ matterId, kind }: { matterId: string; kind: 'audiencia' | 'vencimiento' }) {
  const router = useRouter();
  const { toggle } = useVoice();

  const onPrimary = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/casos/${matterId}/canvas`);
    try { await toggle(); } catch { /* noop */ }
  };

  return (
    <button
      type="button"
      onClick={(e) => void onPrimary(e)}
      className="btn btn-sm btn-primary"
    >
      {kind === 'audiencia' ? 'Preparar alegatos' : 'Redactar contestación'}
    </button>
  );
}

export function DofCardActions() {
  const router = useRouter();
  const { toggle } = useVoice();

  const onResumen = async () => {
    router.push('/notificaciones?tab=dof');
    try { await toggle(); } catch { /* noop */ }
  };

  return (
    <div className="mt-[14px] flex gap-1.5">
      <button type="button" onClick={() => void onResumen()} className="btn btn-sm btn-primary">
        Resumen IA
      </button>
      <Link href="/notificaciones?tab=dof" className="btn btn-sm">
        Ver afectados
      </Link>
    </div>
  );
}

export function QuickActionButton({
  href,
  icon,
  title,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 rounded-[10px] border border-line bg-bg p-[10px_12px] text-left text-ink hover:bg-bg-sunken"
    >
      <span className="grid h-[30px] w-[30px] place-items-center rounded-md bg-accent-soft text-accent-ink">
        {icon}
      </span>
      <span>
        <div className="text-[13px] font-semibold">{title}</div>
        <div className="text-[11.5px] muted">{sub}</div>
      </span>
      <span className="ml-auto inline-flex muted">{Ic.arrow}</span>
    </Link>
  );
}
