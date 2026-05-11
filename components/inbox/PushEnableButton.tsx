'use client';

import { useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { registerPush } from '@/lib/push/register';

export function PushEnableButton() {
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);

  async function enable() {
    setBusy(true);
    try {
      const r = await registerPush();
      if (r.ok) {
        setEnabled(true);
        toast.success('Notificaciones push activadas en este dispositivo');
      } else {
        setEnabled(false);
        toast.message('No se pudieron activar push', {
          description: r.message || r.reason,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn" onClick={enable} disabled={busy} title="Activar notificaciones del navegador">
      {busy ? (
        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
      ) : enabled ? (
        <Bell size={12} aria-hidden="true" />
      ) : (
        <BellOff size={12} aria-hidden="true" />
      )}
      {enabled ? 'Push activo' : 'Activar push'}
    </button>
  );
}
