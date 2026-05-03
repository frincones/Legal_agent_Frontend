'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RealtimeClient } from '@/components/voice/RealtimeClient';
import { useVoiceStore } from '@/lib/stores/voice-store';
import { uiCommandBus, type UICommand } from '@/lib/voice/ui-command-bus';
import { openCommandPalette } from '@/components/shell/SidebarSearchTrigger';

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
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [micPermission, setMicPermission] = useState<VoiceCtx['micPermission']>('prompt');
  const clientRef = useRef<RealtimeClient | null>(null);
  const setHud = useVoiceStore((s) => s.setState);
  const setMatter = useVoiceStore((s) => s.setMatter);

  useEffect(() => {
    setMatter(matterId ?? null);
  }, [matterId, setMatter]);

  // F1 · UI Bridge — registrar handlers default en UICommandBus.
  // Estos manejan navigate, scroll, toast, modal y prefill_form (delega al
  // formApi registrado por cada formulario). Cleanup en unmount.
  useEffect(() => {
    const unsubs = [
      uiCommandBus.register('navigate', (cmd) => {
        if (cmd.action !== 'navigate') return false;
        try {
          router.push(cmd.path);
          return true;
        } catch (e) {
          console.error('[VoiceProvider] navigate failed', e);
          return false;
        }
      }),
      uiCommandBus.register('open_matter_tab', (cmd) => {
        if (cmd.action !== 'open_matter_tab') return false;
        // Navega + emite evento para que MatterTabs seleccione la pestaña.
        try {
          router.push(`/casos/${cmd.matter_id}?tab=${encodeURIComponent(cmd.tab)}`);
          window.dispatchEvent(new CustomEvent('lexai:matter-tab-select', { detail: { tab: cmd.tab } }));
          return true;
        } catch {
          return false;
        }
      }),
      uiCommandBus.register('scroll_to', (cmd) => {
        if (cmd.action !== 'scroll_to') return false;
        if (typeof document === 'undefined') return false;
        const el = document.querySelector(`[data-scroll-target="${CSS.escape(cmd.target)}"]`);
        if (!el) return false;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }),
      uiCommandBus.register('open_command_palette', (cmd) => {
        if (cmd.action !== 'open_command_palette') return false;
        openCommandPalette();
        return true;
      }),
      uiCommandBus.register('toast', (cmd) => {
        if (cmd.action !== 'toast') return false;
        const fn =
          cmd.variant === 'success' ? toast.success
          : cmd.variant === 'warning' ? toast.warning
          : cmd.variant === 'error' ? toast.error
          : toast.info;
        fn(cmd.message);
        return true;
      }),
      uiCommandBus.register('open_modal', (cmd) => {
        if (cmd.action !== 'open_modal') return false;
        // MVP: usar window.confirm para no introducir modal nuevo. Reemplazable
        // por un modal estilizado registrando otro handler.
        const ok = typeof window !== 'undefined'
          ? window.confirm(`${cmd.title}\n\n${cmd.body}`)
          : true;
        if (ok) toast(cmd.confirm_label ?? 'Aceptado');
        return true;
      }),
      uiCommandBus.register('prefill_form', async (cmd) => {
        if (cmd.action !== 'prefill_form') return false;
        const api = uiCommandBus.getFormApi(cmd.form);
        if (!api) {
          toast.warning(`Formulario "${cmd.form}" no está montado en esta pantalla`);
          return false;
        }
        api.setValues(cmd.values);
        if (cmd.submit && api.submit) {
          try {
            await api.submit();
          } catch (e) {
            console.error('[VoiceProvider] form submit failed', e);
          }
        }
        return true;
      }),
      // Canvas operations — requieren que el editor esté montado en /canvas.
      uiCommandBus.register('canvas_set_text', (cmd) => {
        if (cmd.action !== 'canvas_set_text') return false;
        const api = uiCommandBus.getCanvasApi();
        if (!api) {
          toast.warning('Canvas no está abierto. Abre el caso primero.');
          return false;
        }
        api.set_text(cmd.markdown);
        return true;
      }),
      uiCommandBus.register('canvas_append', (cmd) => {
        if (cmd.action !== 'canvas_append') return false;
        const api = uiCommandBus.getCanvasApi();
        if (!api) {
          toast.warning('Canvas no está abierto.');
          return false;
        }
        api.append(cmd.markdown);
        return true;
      }),
      uiCommandBus.register('canvas_replace_section', (cmd) => {
        if (cmd.action !== 'canvas_replace_section') return false;
        const api = uiCommandBus.getCanvasApi();
        if (!api) {
          toast.warning('Canvas no está abierto.');
          return false;
        }
        api.replace_section(cmd.heading, cmd.markdown);
        return true;
      }),
      uiCommandBus.register('canvas_save_version', async (cmd) => {
        if (cmd.action !== 'canvas_save_version') return false;
        const api = uiCommandBus.getCanvasApi();
        if (!api) return false;
        await api.save_version();
        toast.success('Versión guardada');
        return true;
      }),
    ];
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [router]);

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
    // Respetar el flag de pausa: el agente sigue conectado pero ignora el push-to-talk.
    if (useVoiceStore.getState().paused) {
      toast.info('Agente pausado — usa el menú "..." para reanudar');
      return;
    }
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

  // Idle timeout — auto-desconecta tras 90s sin actividad para NO quemar
  // tokens en silencio. El usuario reanuda con Espacio o click en el orb
  // (pttDown detecta clientRef=null y reabre la sesión).
  useEffect(() => {
    const IDLE_MS = 90_000;
    const CHECK_INTERVAL_MS = 15_000;
    const interval = setInterval(() => {
      const c = clientRef.current;
      if (!c) return;
      const last = useVoiceStore.getState().lastActivityAt;
      const elapsed = Date.now() - last;
      if (elapsed > IDLE_MS) {
        toast.info('Sesión pausada por inactividad', {
          description: 'Pulsa Espacio o el orb para reanudar',
        });
        void c.close();
        clientRef.current = null;
        setReady(false);
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

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
