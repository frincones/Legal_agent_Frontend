'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2, Clock, FileSignature, Loader2, MoreHorizontal,
  Plus, RefreshCcw, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { EnvelopeWizard } from './EnvelopeWizard';
import { EnvelopeDetail } from './EnvelopeDetail';
import { cn, formatRelative } from '@/lib/utils';

type Envelope = {
  id: string;
  matter_id: string | null;
  title: string;
  provider: string;
  status: string;
  signer_count: number;
  signed_count: number;
  sent_at: string | null;
  completed_at: string | null;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string; icon: JSX.Element }> = {
  draft: { label: 'Borrador', cls: 'border-line text-ink-3', icon: <Clock size={11} aria-hidden="true" /> },
  sent: { label: 'Enviado', cls: 'border-blue-500/40 text-blue-500', icon: <Clock size={11} aria-hidden="true" /> },
  viewed: { label: 'Visto', cls: 'border-blue-500/40 text-blue-500', icon: <Clock size={11} aria-hidden="true" /> },
  partially_signed: { label: 'Parcial', cls: 'border-amber-500/40 text-amber-500', icon: <Clock size={11} aria-hidden="true" /> },
  signed: { label: 'Firmado', cls: 'border-emerald-500/40 text-emerald-500', icon: <CheckCircle2 size={11} aria-hidden="true" /> },
  declined: { label: 'Rechazado', cls: 'border-red-500/40 text-red-500', icon: <XCircle size={11} aria-hidden="true" /> },
  expired: { label: 'Expirado', cls: 'border-red-500/40 text-red-500', icon: <XCircle size={11} aria-hidden="true" /> },
  canceled: { label: 'Cancelado', cls: 'border-line text-ink-3 line-through', icon: <XCircle size={11} aria-hidden="true" /> },
};

export function EnvelopesList() {
  const [items, setItems] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [openWizard, setOpenWizard] = useState(false);
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/signatures/envelopes?limit=100', { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <div className="grid gap-3">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 className="serif text-[16px] font-semibold">Sobres de firma</h2>
          <p className="text-[12px] muted">Envía documentos a firma electrónica · Certicámara / DocuSign / Demo.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={refresh}>
            <RefreshCcw size={12} aria-hidden="true" /> Refrescar
          </button>
          <button className="btn btn-primary" onClick={() => setOpenWizard(true)}>
            <Plus size={14} aria-hidden="true" /> Nuevo sobre
          </button>
        </div>
      </header>

      {loading ? (
        <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="surface p-6 text-center text-[12.5px] muted">
          Sin sobres. Crea el primero para enviar un documento a firma.
        </div>
      ) : (
        <div className="surface overflow-x-auto p-2">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                <th className="py-2">Título</th>
                <th className="py-2">Provider</th>
                <th className="py-2">Firmantes</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Enviado</th>
                <th className="py-2">Completado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => {
                const m = STATUS_META[e.status] || { label: e.status, cls: 'border-line', icon: <Clock size={11} /> };
                return (
                  <tr key={e.id} className="border-t border-line text-[12.5px] hover:bg-bg-elev cursor-pointer" onClick={() => setOpenDetail(e.id)}>
                    <td className="py-2.5 font-semibold">
                      <FileSignature size={12} className="mr-1 inline text-accent" aria-hidden="true" />
                      {e.title}
                    </td>
                    <td className="py-2.5 muted capitalize">{e.provider}</td>
                    <td className="py-2.5 mono">{e.signed_count}/{e.signer_count}</td>
                    <td className="py-2.5">
                      <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-semibold', m.cls)}>
                        {m.icon} {m.label}
                      </span>
                    </td>
                    <td className="py-2.5 muted">{e.sent_at ? formatRelative(e.sent_at) : '—'}</td>
                    <td className="py-2.5 muted">{e.completed_at ? formatRelative(e.completed_at) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EnvelopeWizard open={openWizard} onOpenChange={setOpenWizard} onCreated={refresh} />
      {openDetail && (
        <EnvelopeDetail
          envelopeId={openDetail}
          onClose={() => { setOpenDetail(null); void refresh(); }}
        />
      )}
    </div>
  );
}
