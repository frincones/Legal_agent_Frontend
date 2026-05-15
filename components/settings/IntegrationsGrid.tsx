'use client';

/**
 * Sprint A · IntegrationsGrid
 *
 * Grid de cards para los providers nuevos (no toca IntegrationsManager,
 * CalendarIntegrationsManager ni WhatsAppIntegrationPanel existentes):
 *   - Google Drive
 *   - OneDrive
 *   - Dropbox
 *   - DocuSign
 *
 * Cada card:
 *   - Logo + nombre
 *   - Estado (badge)
 *   - Botón "Conectar" (inicia OAuth) o "Desconectar"
 *   - Última sincronización si aplica
 *
 * Realtime: subscribe a firm_integrations · updates status en vivo
 * sin polling. Filtrado por firm_id en server-side (via supabase channel).
 */

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Trash2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { formatRelative } from '@/lib/utils';

type Provider = 'google_drive' | 'onedrive' | 'dropbox' | 'docusign';
type Status = 'pending' | 'connected' | 'expired' | 'revoked' | 'error';

type Integration = {
  id: string;
  provider: Provider;
  account_id: string | null;
  account_label: string | null;
  status: Status;
  last_status: string | null;
  last_error: string | null;
  last_synced_at: string | null;
  oauth_expires_at: string | null;
  scopes: string[];
  active: boolean;
  created_at: string;
};

const PROVIDERS: Array<{
  key: Provider;
  name: string;
  category: 'storage' | 'signature';
  description: string;
  icon: () => JSX.Element;
}> = [
  {
    key: 'google_drive',
    name: 'Google Drive',
    category: 'storage',
    description: 'Documentos del caso desde Drive',
    icon: GoogleDriveIcon,
  },
  {
    key: 'onedrive',
    name: 'OneDrive',
    category: 'storage',
    description: 'Documentos del caso desde Microsoft 365',
    icon: OneDriveIcon,
  },
  {
    key: 'dropbox',
    name: 'Dropbox',
    category: 'storage',
    description: 'Documentos del caso desde Dropbox',
    icon: DropboxIcon,
  },
  {
    key: 'docusign',
    name: 'DocuSign',
    category: 'signature',
    description: 'Firma electrónica desde Canvas',
    icon: DocuSignIcon,
  },
];

export function IntegrationsGrid() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/integrations', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Failed to load integrations', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Realtime · escucha INSERT/UPDATE/DELETE en firm_integrations
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('firm_integrations_grid')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'firm_integrations' },
        () => {
          void refresh();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  async function onConnect(provider: Provider) {
    setConnectingProvider(provider);
    try {
      const r = await fetch(`/api/integrations/start/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_to: '/settings/integraciones' }),
      });
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        toast.error(errBody?.detail?.message || `No pude iniciar OAuth (${r.status})`);
        return;
      }
      const data = await r.json();
      if (!data?.auth_url) {
        toast.error('Respuesta inválida del servidor');
        return;
      }
      // Redirect al provider
      window.location.href = data.auth_url;
    } catch (e: any) {
      toast.error('Error conectando: ' + (e?.message || 'desconocido'));
    } finally {
      setConnectingProvider(null);
    }
  }

  async function onDisconnect(integration: Integration) {
    if (!confirm(`¿Desconectar ${PROVIDERS.find(p => p.key === integration.provider)?.name}?`)) return;
    try {
      const r = await fetch(`/api/integrations/${integration.id}`, { method: 'DELETE' });
      if (r.ok) {
        toast.success('Integración desconectada');
        void refresh();
      } else {
        toast.error('No pude desconectar');
      }
    } catch {
      toast.error('Error al desconectar');
    }
  }

  // Map provider → integration (sólo una activa por provider en este Sprint A)
  const byProvider = new Map<Provider, Integration>();
  for (const it of items) {
    if (it.active) byProvider.set(it.provider, it);
  }

  return (
    <div className="grid gap-5">
      <div>
        <h3 className="serif text-[15px] font-semibold">Documentos y firma</h3>
        <p className="mt-1 text-[12.5px] muted">
          Conecta tus nubes para que LexAI lea documentos del caso, y DocuSign para firma electrónica desde Canvas.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" /> Cargando integraciones…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PROVIDERS.map(p => {
            const integration = byProvider.get(p.key);
            return (
              <ProviderCard
                key={p.key}
                meta={p}
                integration={integration}
                isConnecting={connectingProvider === p.key}
                onConnect={() => onConnect(p.key)}
                onDisconnect={() => integration && onDisconnect(integration)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  meta,
  integration,
  isConnecting,
  onConnect,
  onDisconnect,
}: {
  meta: typeof PROVIDERS[number];
  integration?: Integration;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connected = integration?.status === 'connected';
  const errored = integration?.status === 'error' || integration?.status === 'expired';
  return (
    <div className="surface flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-bg-2">
          {meta.icon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="serif text-[14px] font-semibold">{meta.name}</h4>
            <StatusBadge status={integration?.status} />
          </div>
          <p className="mt-0.5 text-[12px] muted">{meta.description}</p>
          {integration?.account_label && (
            <p className="mt-1 text-[11.5px] text-ink-2 truncate">
              {integration.account_label}
            </p>
          )}
          {integration?.last_synced_at && (
            <p className="mt-0.5 text-[11px] muted">
              Sincronizado {formatRelative(integration.last_synced_at)}
            </p>
          )}
          {errored && integration?.last_error && (
            <p className="mt-1 text-[11.5px] text-danger">
              <AlertCircle size={11} className="inline" /> {integration.last_error}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-1.5">
        {connected ? (
          <>
            <button
              className="btn btn-sm flex-1"
              onClick={onDisconnect}
            >
              <Trash2 size={12} /> Desconectar
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary btn-sm flex-1"
            disabled={isConnecting}
            onClick={onConnect}
          >
            {isConnecting ? (
              <><Loader2 size={12} className="animate-spin" /> Iniciando…</>
            ) : (
              <>Conectar</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: Status }) {
  if (!status) return null;
  if (status === 'connected') {
    return (
      <span className="chip chip-green text-[10.5px]">
        <CheckCircle2 size={10} /> Conectado
      </span>
    );
  }
  if (status === 'expired') {
    return (
      <span className="chip chip-amber text-[10.5px]">
        <AlertCircle size={10} /> Expirado
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="chip chip-red text-[10.5px]">
        <XCircle size={10} /> Error
      </span>
    );
  }
  if (status === 'revoked') {
    return <span className="chip text-[10.5px] muted">Revocado</span>;
  }
  return <span className="chip text-[10.5px] muted">Pendiente</span>;
}

// ─────────────────────────────────────────────────────────────────────
// Icons · SVG inline (sin deps)
// ─────────────────────────────────────────────────────────────────────

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path fill="#0066DA" d="M5 18l2.5-4.3h12L17 18z" />
      <path fill="#00AC47" d="M5.5 13.7L10 6h4l-4.5 7.7z" />
      <path fill="#EA4335" d="M14 6l4.5 7.7h-9z" />
      <path fill="#00832D" d="M19.5 13.7L17 18l-4.5-7.7L15 6z" opacity="0" />
      <path fill="#2684FC" d="M9.5 13.7L7 18 2.5 10.3 5 6z" opacity="0" />
      <path fill="#FFBA00" d="M19.5 13.7L21.5 10.3 17 2.5 13 9.4z" opacity="0" />
    </svg>
  );
}

function OneDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path fill="#0078D4" d="M10.5 8c-2.7 0-5 2-5.3 4.6C3.4 13 2 14.5 2 16.4 2 18.4 3.6 20 5.6 20h13.7c1.5 0 2.7-1.2 2.7-2.7 0-1.3-.9-2.4-2.1-2.6.1-.4.2-.8.2-1.2 0-2.5-2-4.5-4.5-4.5-.8 0-1.5.2-2.2.6C12.7 8.7 11.7 8 10.5 8z" />
    </svg>
  );
}

function DropboxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path fill="#0061FF" d="M6 2L1.5 5 6 8l4.5-3zM18 2l-4.5 3L18 8l4.5-3zM1.5 11L6 14l4.5-3L6 8zM18 8l-4.5 3 4.5 3 4.5-3zM6.5 15l4.5 3 4.5-3-4.5-3z" />
    </svg>
  );
}

function DocuSignIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path fill="#FFCC22" d="M3 3h14l4 4v14H3z" />
      <path fill="#000" fillOpacity="0.85" d="M7 11h10v1.2H7zM7 14h8v1.2H7zM7 17h6v1.2H7z" />
      <path fill="#000" fillOpacity="0.6" d="M17 3v4h4z" />
    </svg>
  );
}
