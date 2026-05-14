'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bell, CheckCircle2, Copy, KeyRound, Loader2, RefreshCcw, Send, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Status = {
  vapid_configured: boolean;
  vapid_public_key: string | null;
  vapid_subject: string;
  counts: { subscriptions: number; subscriptions_active: number; sent_24h: number; failed_24h: number };
};
type LogRow = {
  id: string; user_id: string | null; title: string; body: string | null;
  url: string | null; kind: string | null; status: string;
  http_status: number | null; error: string | null; sent_at: string | null;
};

export function PushAdminPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ public_key: string; private_key: string; subject: string; instructions: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        fetch('/api/push/admin/status', { cache: 'no-store' }),
        fetch('/api/push/admin/logs?limit=30', { cache: 'no-store' }),
      ]);
      if (s.ok) setStatus(await s.json());
      if (l.ok) setLogs((await l.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function generate() {
    if (!confirm('Generar un par nuevo de VAPID keys? Tendrás que actualizar las env vars de Railway y Vercel.')) return;
    setGenerating(true);
    try {
      const r = await fetch('/api/push/admin/generate-vapid', { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setGenResult(d);
      toast.success('Keys generadas · copia las variables a Railway/Vercel');
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setGenerating(false);
    }
  }

  async function sendTest() {
    const r = await fetch('/api/push/test', { method: 'POST' });
    if (!r.ok) { toast.error('Error'); return; }
    const d = await r.json();
    toast.success(`Push test · ${d.sent || 0} enviadas · ${d.failed || 0} fallidas`);
    await refresh();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success('Copiado'));
  }

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
        <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <header>
        <h2 className="serif text-[16px] font-semibold">Web Push (VAPID)</h2>
        <p className="text-[12px] muted">
          Notificaciones push del navegador. Configura una sola vez por firma.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <Tile label="Suscripciones" v={status?.counts.subscriptions ?? 0} />
        <Tile label="Activas" v={status?.counts.subscriptions_active ?? 0} />
        <Tile label="Enviadas 24h" v={status?.counts.sent_24h ?? 0} icon={<CheckCircle2 size={12} className="text-emerald-500" aria-hidden="true" />} />
        <Tile label="Fallidas 24h" v={status?.counts.failed_24h ?? 0} icon={<XCircle size={12} className="text-red-500" aria-hidden="true" />} variant={status?.counts.failed_24h ? 'warning' : undefined} />
      </div>

      <section className="surface p-4">
        <div className="flex items-start gap-3">
          <KeyRound size={18} className="mt-1 text-accent" aria-hidden="true" />
          <div className="flex-1">
            <div className="text-[14px] font-semibold">
              Estado VAPID:{' '}
              {status?.vapid_configured ? (
                <span className="text-emerald-500">Configurado ✓</span>
              ) : (
                <span className="text-amber-500">No configurado</span>
              )}
            </div>
            {status?.vapid_configured && status.vapid_public_key && (
              <div className="mt-2 grid gap-1.5 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="muted w-32">Subject:</span>
                  <span className="mono">{status.vapid_subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="muted w-32">Public key:</span>
                  <span className="mono truncate max-w-md">{status.vapid_public_key.slice(0, 32)}…</span>
                  <button onClick={() => copy(status.vapid_public_key!)} className="btn ml-auto">
                    <Copy size={11} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={generate} disabled={generating}>
                {generating ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <KeyRound size={12} aria-hidden="true" />}
                {status?.vapid_configured ? 'Regenerar keys' : 'Generar keys'}
              </button>
              <button className="btn" onClick={sendTest} disabled={!status?.vapid_configured}>
                <Send size={12} aria-hidden="true" /> Enviar test a mí
              </button>
              <button className="btn" onClick={refresh}>
                <RefreshCcw size={12} aria-hidden="true" /> Refrescar
              </button>
            </div>
          </div>
        </div>
      </section>

      {genResult && (
        <section className="surface border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-amber-500" aria-hidden="true" />
            <strong className="text-amber-500">Acción requerida · Configura las env vars</strong>
          </div>
          <p className="mt-1 text-[12px] muted">
            Las keys SOLO se mostraron aquí. Copialas a Railway (backend) y Vercel (frontend) y redespliega.
          </p>
          <pre className="mt-3 rounded border border-line bg-bg-elev p-3 text-[11px] mono whitespace-pre-wrap break-all">
{`# Railway · backend
VAPID_PUBLIC_KEY=${genResult.public_key}
VAPID_PRIVATE_KEY=${genResult.private_key}
VAPID_SUBJECT=${genResult.subject}

# Vercel · frontend (solo public)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${genResult.public_key}`}
          </pre>
          <div className="mt-2 flex gap-2">
            <button className="btn" onClick={() => copy(genResult.public_key)}><Copy size={11} aria-hidden="true" /> Pública</button>
            <button className="btn" onClick={() => copy(genResult.private_key)}><Copy size={11} aria-hidden="true" /> Privada</button>
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 serif text-[14px] font-semibold">Últimos envíos</h3>
        <div className="surface overflow-x-auto p-2">
          {logs.length === 0 ? (
            <div className="p-3 text-[12.5px] muted">Sin envíos registrados.</div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                  <th className="py-2">Cuando</th>
                  <th className="py-2">Título</th>
                  <th className="py-2">Cuerpo</th>
                  <th className="py-2">URL</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-line">
                    <td className="py-1.5 muted">{l.sent_at && formatRelative(l.sent_at)}</td>
                    <td className="py-1.5 font-semibold">{l.title}</td>
                    <td className="py-1.5 muted truncate max-w-[200px]">{l.body}</td>
                    <td className="py-1.5 mono text-[11px] muted">{l.url || '—'}</td>
                    <td className="py-1.5">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[11px]',
                        l.status === 'sent' && 'text-emerald-500',
                        l.status === 'failed' && 'text-red-500',
                      )}>
                        {l.status === 'sent' ? <CheckCircle2 size={11} aria-hidden="true" /> : <XCircle size={11} aria-hidden="true" />}
                        {l.status} {l.http_status && `(${l.http_status})`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function Tile({ label, v, icon, variant }: { label: string; v: number; icon?: JSX.Element; variant?: 'warning' }) {
  return (
    <div className={cn('surface p-3', variant === 'warning' && 'border-amber-500/40')}>
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider muted">{icon} {label}</div>
      <div className="serif text-[22px] font-semibold">{v}</div>
    </div>
  );
}
