'use client';

/**
 * Sprint D · FirmasTab
 *
 * Lista de envelopes del caso con estado live (Realtime).
 * Acciones: Recordar (resend) / Anular (void) / Ver auditoría.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  FileSignature, CheckCircle2, Clock, AlertCircle, Loader2,
  Send, XCircle, Download, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import type { LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatRelative } from '@/lib/utils';

type Envelope = {
  id: string;
  matter_id: string | null;
  title: string;
  provider: string;
  external_id: string | null;
  status: string;
  signer_count: number;
  signed_count: number;
  signers: Array<{ name: string; email: string; routing_order: number }>;
  sent_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  signed_pdf_storage_path: string | null;
  created_at: string | null;
};

const STATUS_META: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  sent:      { label: 'Enviado',      color: 'chip-amber', icon: Send },
  delivered: { label: 'Entregado',    color: 'chip-amber', icon: Clock },
  completed: { label: 'Firmado',      color: 'chip-green', icon: CheckCircle2 },
  declined:  { label: 'Rechazado',    color: 'chip-red',   icon: XCircle },
  voided:    { label: 'Anulado',      color: '',            icon: XCircle },
  expired:   { label: 'Expirado',     color: 'chip-red',   icon: AlertCircle },
  created:   { label: 'Borrador',     color: '',            icon: Clock },
};

export function FirmasTab({ matterId }: { matterId: string }) {
  const [items, setItems] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/docusign/envelopes?matter_id=${encodeURIComponent(matterId)}`, { cache: 'no-store' });
      if (r.ok) setItems(await r.json());
    } catch (e) {
      console.warn('Failed to fetch envelopes', e);
    } finally {
      setLoading(false);
    }
  }, [matterId]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Realtime · escucha cambios en signature_envelopes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`signatures_matter_${matterId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signature_envelopes', filter: `matter_id=eq.${matterId}` },
        () => { void refresh(); }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [matterId, refresh]);

  async function onResend(env: Envelope) {
    setActionLoading(env.id);
    try {
      const r = await fetch(`/api/docusign/envelopes/${env.id}/resend`, { method: 'POST' });
      if (r.ok) {
        toast.success('Recordatorio enviado a los firmantes');
      } else {
        toast.error('No pude reenviar');
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function onVoid(env: Envelope) {
    if (!confirm(`¿Anular envelope "${env.title}"? Los firmantes no podrán firmarlo.`)) return;
    setActionLoading(env.id);
    try {
      const r = await fetch(`/api/docusign/envelopes/${env.id}/void`, { method: 'POST' });
      if (r.ok) {
        toast.success('Envelope anulado');
        void refresh();
      } else {
        toast.error('No pude anular');
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="surface flex items-center gap-2 p-4 text-[12.5px] muted">
        <Loader2 size={14} className="animate-spin" /> Cargando firmas…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="surface flex flex-col items-center gap-2 p-8 text-center">
        <FileSignature size={32} className="text-ink-3" />
        <h3 className="serif text-[14px] font-semibold">Sin envelopes</h3>
        <p className="text-[12px] muted max-w-sm">
          Envía un documento a firma desde el Canvas con "Enviar a firma DocuSign".
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {items.map(env => {
        const meta = STATUS_META[env.status] ?? STATUS_META.created!;
        const Icon = meta.icon;
        const isFinalState = ['completed', 'voided', 'declined', 'expired'].includes(env.status);
        return (
          <div key={env.id} className="surface p-4 grid gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileSignature size={14} className="text-accent flex-none" />
                  <h4 className="serif text-[14px] font-semibold truncate">{env.title}</h4>
                  <span className={`chip text-[10.5px] ${meta.color}`}>
                    <Icon size={10} /> {meta.label}
                  </span>
                </div>
                <p className="mt-1 text-[12px] muted">
                  {env.signed_count}/{env.signer_count} firmados ·
                  {env.sent_at && ` enviado ${formatRelative(env.sent_at)}`}
                  {env.completed_at && ` · completado ${formatRelative(env.completed_at)}`}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {env.signers.map((s, i) => (
                    <span key={i} className="chip text-[10px]" title={s.email}>
                      {i + 1}. {s.name || s.email}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-none">
                {!isFinalState && (
                  <>
                    <button
                      type="button"
                      onClick={() => onResend(env)}
                      disabled={actionLoading === env.id}
                      className="btn btn-sm"
                      title="Reenviar email a los firmantes"
                    >
                      {actionLoading === env.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                      Recordar
                    </button>
                    <button
                      type="button"
                      onClick={() => onVoid(env)}
                      disabled={actionLoading === env.id}
                      className="btn btn-sm"
                      title="Anular envelope"
                    >
                      <XCircle size={11} /> Anular
                    </button>
                  </>
                )}
                {env.status === 'completed' && env.signed_pdf_storage_path && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    title="Descargar PDF firmado"
                  >
                    <Download size={11} /> Descargar
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
