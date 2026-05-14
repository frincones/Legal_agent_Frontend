'use client';

import { usePresence } from '@/lib/hooks/usePresence';

/**
 * Sprint 16 · Componente cliente sin UI que mantiene viva la fila
 * presence_sessions del usuario en este matter. Lo rendea la page server
 * de /casos/[matterId] para que el RSC siga siendo RSC.
 */
export function MatterPresenceHeartbeat({ matterId }: { matterId: string }) {
  usePresence({ matterId, locationKind: 'matter' });
  return null;
}
