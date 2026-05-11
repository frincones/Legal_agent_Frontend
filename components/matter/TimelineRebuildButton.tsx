'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Llama a `POST /v1/matters/{id}/timeline/auto-rebuild` y refresca la
 * página para que la cronología se vea actualizada. El endpoint es
 * idempotente: solo inserta eventos para documentos no representados.
 */
export function TimelineRebuildButton({ matterId }: { matterId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/matters/${encodeURIComponent(matterId)}/timeline/auto-rebuild`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.slice(0, 200) || `Error ${res.status}`);
      }
      const data = (await res.json()) as { inserted: number; scanned: number };
      if (data.inserted === 0) {
        toast.info(`Cronología al día (${data.scanned} documentos revisados).`);
      } else {
        toast.success(`Se agregaron ${data.inserted} evento${data.inserted === 1 ? '' : 's'}.`);
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error reconstruyendo cronología');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-sm"
      onClick={() => void handleClick()}
      disabled={busy}
      title="Reconstruye automáticamente la cronología desde los documentos del caso"
    >
      {busy ? (
        <Loader2 size={12} className="animate-spin" aria-hidden="true" />
      ) : (
        <RefreshCw size={12} aria-hidden="true" />
      )}
      {busy ? 'Reconstruyendo…' : 'Reconstruir cronología'}
    </button>
  );
}
