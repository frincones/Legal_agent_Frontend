'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CanvasEditor } from '@/components/canvas/CanvasEditor';
import { CanvasStreamRunner } from '@/components/canvas/CanvasStreamRunner';
import { Ic } from '@/components/atoms/icons';

type CanvasState = {
  document_id: string;
  titulo: string;
  html: string;
  version: number;
};

/** Bridge entre la page canvas (server) y el editor (client).
 *  Resuelve el matter_document de tipo 'generado' (lo crea si no existe)
 *  y carga la última versión guardada para hidratar el editor. */
export function CanvasMain({
  matterId,
  userInfo,
}: {
  matterId: string;
  userInfo?: { name: string; email?: string };
}) {
  const [state, setState] = useState<CanvasState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/matter-documents/canvas?matter_id=${matterId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as CanvasState;
        if (!cancelled) setState(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error cargando canvas';
        if (!cancelled) {
          setError(msg);
          toast.error(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matterId]);

  if (error) {
    return (
      <div className="surface m-4 p-6 text-center">
        <div className="serif text-[16px] font-semibold text-danger">No se pudo cargar el Canvas</div>
        <div className="mt-2 text-[12.5px] muted">{error}</div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="surface m-4 p-6 text-center muted">
        <span className="inline-flex items-center gap-2">
          {Ic.bolt} Cargando documento…
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CanvasStreamRunner matterId={matterId} />
      <div className="flex-1 min-h-0">
        <CanvasEditor
          matterId={matterId}
          documentId={state.document_id}
          initialContent={state.html}
          userInfo={userInfo}
        />
      </div>
    </div>
  );
}
