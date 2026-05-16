'use client';

/**
 * Sprint J · Yjs collaboration hook
 *
 * Gestiona Y.Doc + WebsocketProvider para colaboración real-time.
 * Flujo:
 *   1. Si NEXT_PUBLIC_COLLAB_ENABLED !== 'true' → null (modo offline)
 *   2. POST /api/canvas/ws-ticket → ticket HMAC corto (60s)
 *   3. Conectar a wss://{API_BASE}/v1/canvas/collab/{room}?ticket={ticket}
 *   4. Awareness: emit user info (name, color) para CollaborationCursor
 *
 * El servidor Railway hace relay puro (broadcast bin frames a peers del room).
 * Persistencia la maneja el autosave TipTap (cada 3s a matter_document_versions).
 *
 * Room = matter_id · cada documento es su propio espacio colaborativo;
 * el backend ya prefijaba con firm:{firm_id} para aislar tenants.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export type CollabUser = {
  name: string;
  email?: string;
  color?: string;
};

export type CollabState = {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  connected: boolean;
  peers: number;
} | null;

const USER_COLORS = [
  '#9333ea', '#d97706', '#dc2626', '#0891b2', '#16a34a',
  '#db2777', '#7c3aed', '#0284c7', '#65a30d', '#ea580c',
];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return USER_COLORS[Math.abs(h) % USER_COLORS.length]!;
}

function deriveWsUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const explicit = process.env.NEXT_PUBLIC_YWS_URL;
  if (explicit) return explicit;
  const apiBase = process.env.NEXT_PUBLIC_RAILWAY_API;
  if (!apiBase) return null;
  return apiBase.replace(/^https?/, (m) => (m === 'https' ? 'wss' : 'ws'));
}

export function useCollaboration(
  roomName: string,
  user?: CollabUser,
): CollabState {
  const enabled =
    typeof window !== 'undefined' && process.env.NEXT_PUBLIC_COLLAB_ENABLED === 'true';

  const wsBase = useMemo(deriveWsUrl, []);

  // Tenemos que crear el ydoc y provider sólo después de obtener el ticket.
  // Por eso usamos refs + state para exponerlo cuando esté listo.
  const [state, setState] = useState<CollabState>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (!enabled || !wsBase || !roomName) return;

    let provider: WebsocketProvider | null = null;
    let ydoc: Y.Doc | null = null;

    (async () => {
      try {
        const res = await fetch('/api/canvas/ws-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matter_id: roomName }),
        });
        if (!res.ok) {
          console.warn('[useCollaboration] ws-ticket failed', res.status);
          return;
        }
        const { ticket } = (await res.json()) as { ticket: string };
        if (cancelledRef.current) return;

        ydoc = new Y.Doc();
        const wsServerUrl = `${wsBase}/v1/canvas/collab`;
        provider = new WebsocketProvider(
          wsServerUrl,
          `lexai-matter:${roomName}`,
          ydoc,
          {
            params: { ticket },
            connect: true,
          },
        );

        if (user) {
          const color = user.color || hashColor(user.email || user.name);
          provider.awareness.setLocalStateField('user', {
            name: user.name,
            color,
          });
        }

        const updateState = () => {
          if (!provider || !ydoc || cancelledRef.current) return;
          setState({
            ydoc,
            provider,
            connected: provider.wsconnected,
            peers: provider.awareness.getStates().size,
          });
        };
        provider.on('status', updateState);
        provider.awareness.on('change', updateState);
        provider.on('sync', updateState);
        updateState();
      } catch (e) {
        console.warn('[useCollaboration] init error', e);
      }
    })();

    return () => {
      cancelledRef.current = true;
      try {
        provider?.destroy();
      } catch {
        /* noop */
      }
      try {
        ydoc?.destroy();
      } catch {
        /* noop */
      }
      setState(null);
    };
  }, [enabled, wsBase, roomName, user?.name, user?.email, user?.color]);

  return state;
}
