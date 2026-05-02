'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { RealtimeClient } from '@/components/voice/RealtimeClient';
import { useVoiceStore } from '@/lib/stores/voice-store';

type VoiceCtx = {
  ready: boolean;
  micPermission: 'granted' | 'denied' | 'prompt' | 'unsupported';
  pttDown: () => Promise<void>;
  pttUp: () => Promise<void>;
  toggle: () => Promise<void>;
};

const Ctx = createContext<VoiceCtx | null>(null);

/** Returns the voice context, or a no-op fallback when used outside the
 *  provider (e.g. on the public landing or onboarding/demo). The HUD is
 *  rendered everywhere; outside the (app)/* tree it's display-only. */
const NOOP_CTX: VoiceCtx = {
  ready: false,
  micPermission: 'unsupported',
  pttDown: async () => {},
  pttUp: async () => {},
  toggle: async () => {},
};

export function useVoice(): VoiceCtx {
  return useContext(Ctx) ?? NOOP_CTX;
}

export function VoiceProvider({ children, matterId }: { children: React.ReactNode; matterId?: string }) {
  const [ready, setReady] = useState(false);
  const [micPermission, setMicPermission] = useState<VoiceCtx['micPermission']>('prompt');
  const clientRef = useRef<RealtimeClient | null>(null);
  const setHud = useVoiceStore((s) => s.setState);
  const setMatter = useVoiceStore((s) => s.setMatter);

  useEffect(() => {
    setMatter(matterId ?? null);
  }, [matterId, setMatter]);

  // Detect mic permission state without prompting
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setMicPermission('unsupported');
      return;
    }
    if (!('permissions' in navigator)) return;
    (navigator.permissions as Permissions)
      .query({ name: 'microphone' as PermissionName })
      .then((status) => {
        setMicPermission(status.state as VoiceCtx['micPermission']);
        status.onchange = () => setMicPermission(status.state as VoiceCtx['micPermission']);
      })
      .catch(() => {
        // Some browsers don't expose 'microphone' permission; fall back to prompt
        setMicPermission('prompt');
      });
  }, []);

  const issueTicketAndConnect = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    try {
      // 1. Browser must support getUserMedia + WSS
      if (typeof window === 'undefined') return null;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Tu navegador no soporta captura de audio. Usa Chrome/Edge/Safari recientes.');
        setMicPermission('unsupported');
        return null;
      }

      // 2. Issue ticket from frontend → Railway
      const res = await fetch('/api/voice/ticket', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matter_id: matterId ?? null }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Ticket de voz falló: ${res.status} ${txt.slice(0, 100)}`);
      }
      const { ticket } = (await res.json()) as { ticket: string };

      // 3. Open WS to Railway relay
      const client = new RealtimeClient({
        ticket,
        onError: (e) => toast.error(e.message ?? 'Error de voz'),
      });
      await client.connect();
      clientRef.current = client;
      setReady(true);
      return client;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo iniciar voz';
      toast.error(msg);
      console.error('[voice] connect failed:', e);
      return null;
    }
  }, [matterId]);

  const pttDown = useCallback(async () => {
    const c = await issueTicketAndConnect();
    if (!c) return;
    try {
      await c.startListening();
      setMicPermission('granted');
    } catch (e) {
      const err = e as Error & { name?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        toast.error('Permiso de micrófono denegado. Activa el micrófono en la barra del navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('No se detectó micrófono conectado.');
      } else {
        toast.error(`Error de voz: ${err.message ?? 'desconocido'}`);
      }
      console.error('[voice] startListening failed:', e);
    }
  }, [issueTicketAndConnect]);

  const pttUp = useCallback(async () => {
    const c = clientRef.current;
    if (!c) return;
    try {
      await c.stopListening();
      setHud('thinking');
    } catch (e) {
      console.error('[voice] stopListening failed:', e);
    }
  }, [setHud]);

  const toggle = useCallback(async () => {
    const state = useVoiceStore.getState().state;
    if (state === 'idle') {
      await pttDown();
    } else {
      await pttUp();
    }
  }, [pttDown, pttUp]);

  // Spacebar push-to-talk — ignore inside inputs/contenteditable
  useEffect(() => {
    let down = false;
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (!down) {
        down = true;
        e.preventDefault();
        void pttDown();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (down) {
        down = false;
        e.preventDefault();
        void pttUp();
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [pttDown, pttUp]);

  // Cleanup on unmount
  useEffect(() => () => {
    void clientRef.current?.close();
    clientRef.current = null;
  }, []);

  const value = useMemo<VoiceCtx>(
    () => ({ ready, micPermission, pttDown, pttUp, toggle }),
    [ready, micPermission, pttDown, pttUp, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
