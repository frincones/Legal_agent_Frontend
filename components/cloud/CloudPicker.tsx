'use client';

/**
 * Sprint C · CloudPicker
 *
 * Picker unificado para vincular una carpeta de Drive/OneDrive/Dropbox
 * a un caso. Usa el backend (/v1/cloud/{provider}/folders) en lugar de
 * los SDKs nativos de cada provider · simpler y consistente.
 *
 * Flujo:
 *   1. Usuario abre el modal
 *   2. Tabs por provider conectado · solo los que tiene activos
 *   3. Lista carpetas raíz · click para navegar al subnivel
 *   4. Click "Vincular esta carpeta" → POST /api/cloud/watchers
 *   5. Toast + onLinked() callback
 */

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Cloud, Folder, FolderOpen, Loader2, ChevronRight,
  ArrowLeft, X, Check,
} from 'lucide-react';
import { toast } from 'sonner';

type Provider = 'google_drive' | 'onedrive' | 'dropbox';

type FolderEntry = {
  id: string;
  name: string;
  path?: string;
  modified?: string | null;
  url?: string | null;
};

const PROVIDER_NAMES: Record<Provider, string> = {
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
  dropbox: 'Dropbox',
};

export function CloudPicker({
  matterId,
  open,
  onOpenChange,
  onLinked,
}: {
  matterId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onLinked?: (watcher: { id: string; provider: Provider }) => void;
}) {
  const [connectedProviders, setConnectedProviders] = useState<Provider[]>([]);
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<FolderEntry[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Detectar providers conectados al abrir
  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const r = await fetch('/api/integrations', { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        const connected = (Array.isArray(data) ? data : [])
          .filter((i: any) => i.active && i.status === 'connected')
          .map((i: any) => i.provider)
          .filter((p: string) => ['google_drive', 'onedrive', 'dropbox'].includes(p)) as Provider[];
        setConnectedProviders(connected);
        if (connected.length > 0 && !activeProvider) {
          setActiveProvider(connected[0] ?? null);
        }
      } catch (e) {
        console.warn('Failed to fetch integrations', e);
      }
    })();
  }, [open]);  // eslint-disable-line react-hooks/exhaustive-deps

  const loadFolders = useCallback(async (provider: Provider, parentId?: string) => {
    setLoading(true);
    try {
      const url = parentId
        ? `/api/cloud/${provider}/folders?parent_id=${encodeURIComponent(parentId)}`
        : `/api/cloud/${provider}/folders`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        toast.error(body?.detail?.message || `Error ${r.status}`);
        setFolders([]);
        return;
      }
      const data = await r.json();
      setFolders(data.folders || []);
    } catch (e: any) {
      toast.error(e?.message || 'Error cargando carpetas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeProvider || !open) return;
    setBreadcrumb([]);
    void loadFolders(activeProvider);
  }, [activeProvider, open, loadFolders]);

  function enterFolder(f: FolderEntry) {
    setBreadcrumb([...breadcrumb, f]);
    if (activeProvider) void loadFolders(activeProvider, f.id);
  }

  function goBack() {
    const next = breadcrumb.slice(0, -1);
    setBreadcrumb(next);
    const parent = next[next.length - 1];
    if (activeProvider) void loadFolders(activeProvider, parent?.id);
  }

  async function linkFolder(f: FolderEntry) {
    if (!activeProvider) return;
    setSubmitting(f.id);
    try {
      const r = await fetch('/api/cloud/watchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeProvider,
          cloud_folder_id: f.id,
          folder_path: f.path || breadcrumb.map(b => b.name).concat(f.name).join('/'),
          matter_id: matterId,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        toast.error(body?.detail?.message || `Error ${r.status}`);
        return;
      }
      const data = await r.json();
      toast.success(`Carpeta "${f.name}" vinculada · sync iniciado`);
      onLinked?.({ id: data.id, provider: activeProvider });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Error vinculando carpeta');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 surface p-6 max-h-[85vh] overflow-hidden flex flex-col">
          <div className="mb-4 flex items-start justify-between flex-none">
            <div>
              <Dialog.Title className="serif text-[18px] font-semibold">
                Vincular carpeta de nube
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[12.5px] muted">
                Los documentos nuevos en esa carpeta aparecerán automáticamente en el caso.
              </Dialog.Description>
            </div>
            <Dialog.Close className="btn btn-sm"><X size={14} /></Dialog.Close>
          </div>

          {connectedProviders.length === 0 ? (
            <NoProvidersState />
          ) : (
            <>
              <div className="mb-3 flex gap-1 flex-none border-b">
                {connectedProviders.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActiveProvider(p)}
                    className={
                      'px-3 py-2 text-[13px] border-b-2 transition ' +
                      (activeProvider === p
                        ? 'border-accent text-accent font-medium'
                        : 'border-transparent hover:bg-bg-2 text-ink-2')
                    }
                  >
                    {PROVIDER_NAMES[p]}
                  </button>
                ))}
              </div>

              <div className="mb-2 flex items-center gap-1 text-[12px] text-ink-2 flex-none">
                {breadcrumb.length > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="btn btn-sm"
                    title="Volver"
                  >
                    <ArrowLeft size={12} />
                  </button>
                )}
                <span className="muted">/</span>
                {breadcrumb.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1">
                    {b.name}
                    <ChevronRight size={12} />
                  </span>
                ))}
              </div>

              <div className="flex-1 overflow-auto border rounded-md">
                {loading ? (
                  <div className="flex items-center gap-2 p-4 text-[12.5px] muted">
                    <Loader2 size={14} className="animate-spin" /> Cargando carpetas…
                  </div>
                ) : folders.length === 0 ? (
                  <div className="p-6 text-center text-[12.5px] muted">
                    Sin carpetas en este nivel.
                  </div>
                ) : (
                  <ul className="divide-y">
                    {folders.map(f => (
                      <li key={f.id} className="flex items-center justify-between gap-2 p-3 hover:bg-bg-2">
                        <button
                          type="button"
                          onClick={() => enterFolder(f)}
                          className="flex items-center gap-2 flex-1 text-left min-w-0"
                          title="Abrir carpeta"
                        >
                          <Folder size={16} className="text-accent flex-none" />
                          <span className="truncate text-[13px]">{f.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => linkFolder(f)}
                          disabled={submitting === f.id}
                          className="btn btn-sm btn-primary"
                          title="Vincular esta carpeta al caso"
                        >
                          {submitting === f.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <><Check size={12} /> Vincular</>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="mt-3 text-[11.5px] muted flex-none">
                💡 Tip: navega hacia adentro haciendo click en el nombre · click "Vincular" para asociar la carpeta al caso.
                Los archivos se sincronizan en ≤30 min.
              </p>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NoProvidersState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <Cloud size={40} className="text-ink-3" />
      <h3 className="serif text-[15px] font-semibold">Conecta una nube primero</h3>
      <p className="max-w-sm text-[12.5px] muted">
        Para vincular carpetas, conecta Google Drive, OneDrive o Dropbox desde Configuración → Integraciones.
      </p>
      <a href="/settings/integraciones" className="btn btn-primary btn-sm">
        Ir a Integraciones
      </a>
    </div>
  );
}
