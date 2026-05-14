'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, CloudOff, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { countQueuedJobs, requestDrainNow } from '@/lib/offline/queue';

export function OfflineIndicator() {
  // Iniciar online=true para evitar hydration mismatch; el useEffect lo corrige.
  const [online, setOnline] = useState<boolean>(true);
  const [queued, setQueued] = useState(0);
  const [draining, setDraining] = useState(false);

  const refresh = async () => {
    try {
      setQueued(await countQueuedJobs());
    } catch {
      /* IndexedDB no disponible (modo incógnito) — ignorar */
    }
  };

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      setOnline(navigator.onLine);
    }
    void refresh();
    const onOnline = () => {
      setOnline(true);
      toast.success('Conexión recuperada', { duration: 2500 });
      void requestDrainNow();
      setTimeout(refresh, 1500);
    };
    const onOffline = () => {
      setOnline(false);
      toast.message('Sin conexión — los cambios se sincronizan al volver', { duration: 4000 });
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const onSwMsg = (e: MessageEvent) => {
      if (e.data?.type === 'lexai:queue-changed') void refresh();
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSwMsg);
    }
    const interval = window.setInterval(refresh, 15000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMsg);
      }
      window.clearInterval(interval);
    };
  }, []);

  async function drainNow() {
    setDraining(true);
    try {
      await requestDrainNow();
      setTimeout(refresh, 1500);
    } finally {
      setTimeout(() => setDraining(false), 1500);
    }
  }

  if (online && queued === 0) return null;

  return (
    <div className="flex items-center gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-[12.5px]">
      {!online ? (
        <>
          <CloudOff size={14} className="text-amber-500" aria-hidden="true" />
          <span>
            <strong className="text-amber-500">Sin conexión</strong> · los cambios se guardarán
            localmente y se sincronizan al volver.
            {queued > 0 && <span className="ml-2">{queued} pendiente{queued !== 1 ? 's' : ''}</span>}
          </span>
        </>
      ) : (
        <>
          <RefreshCcw size={14} className="text-blue-500" aria-hidden="true" />
          <span>
            <strong className="text-blue-500">Sincronizando…</strong> {queued} pendiente{queued !== 1 ? 's' : ''}
          </span>
          <button className="ml-auto btn" onClick={drainNow} disabled={draining}>
            {draining ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={11} aria-hidden="true" />}
            Sincronizar
          </button>
        </>
      )}
    </div>
  );
}
