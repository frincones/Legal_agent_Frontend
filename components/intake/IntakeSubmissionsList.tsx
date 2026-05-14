'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Mail, Phone, Trash2, UserPlus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Submission = {
  id: string;
  intake_form_id: string;
  form_name: string | null;
  payload: Record<string, unknown>;
  submitter_email: string | null;
  submitter_nombre: string | null;
  submitter_phone: string | null;
  status: 'new' | 'converted' | 'spam' | 'dismissed';
  converted_lead_id: string | null;
  converted_at: string | null;
  notes: string | null;
  ip_address: string | null;
  created_at: string | null;
};

const STATUS_CHIP: Record<Submission['status'], string> = {
  new: 'chip-blue',
  converted: 'chip-green',
  spam: 'chip-danger',
  dismissed: 'chip-neutral',
};

const STATUS_LABEL: Record<Submission['status'], string> = {
  new: 'Nuevo',
  converted: 'Convertido',
  spam: 'Spam',
  dismissed: 'Descartado',
};

export function IntakeSubmissionsList({ formId }: { formId: string }) {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'new' | 'converted' | 'spam' | 'dismissed' | ''>('new');

  const refresh = useCallback(async () => {
    if (!formId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter) params.set('status', statusFilter);
      const r = await fetch(`/api/intake-forms/${formId}/submissions?${params.toString()}`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [formId, statusFilter]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function convertToLead(s: Submission) {
    const r = await fetch(`/api/intake-submissions/${s.id}/convert-to-lead`, { method: 'POST' });
    if (r.ok) {
      toast.success('Lead creado');
      void refresh();
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(data.detail || 'No se pudo convertir');
    }
  }

  async function dismiss(s: Submission) {
    const r = await fetch(`/api/intake-submissions/${s.id}/dismiss`, { method: 'POST' });
    if (r.ok) void refresh();
  }

  async function remove(s: Submission) {
    if (!confirm('¿Eliminar submission?')) return;
    const r = await fetch(`/api/intake-submissions/${s.id}`, { method: 'DELETE' });
    if (r.ok) {
      setItems((p) => p.filter((x) => x.id !== s.id));
      toast.success('Eliminada');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <header className="flex items-center gap-1">
        {(['new', 'converted', 'dismissed', 'spam', ''] as const).map((f) => (
          <button
            key={f || 'all'}
            onClick={() => setStatusFilter(f)}
            className={cn(
              'rounded-md px-2 py-1 text-[11.5px]',
              statusFilter === f ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-bg-sunken',
            )}
          >
            {f === '' ? 'Todas' : STATUS_LABEL[f]}
          </button>
        ))}
      </header>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={20} /></div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-line p-6 text-center text-[12.5px] muted">
          {statusFilter === 'new' ? 'Sin submissions nuevas · todo al día' : 'Sin submissions en este estado'}
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((s) => (
            <li key={s.id} className="rounded-md border border-line bg-bg-elev px-3 py-2">
              <header className="flex flex-wrap items-baseline gap-2">
                <span className="text-[13px] font-semibold">
                  {s.submitter_nombre || s.submitter_email || 'Anónimo'}
                </span>
                <span className={cn('chip text-[10px]', STATUS_CHIP[s.status])}>
                  {STATUS_LABEL[s.status]}
                </span>
                {s.form_name && <span className="text-[10.5px] muted">· {s.form_name}</span>}
                <span className="ml-auto text-[10.5px] muted">
                  {s.created_at ? formatRelative(s.created_at) : ''}
                </span>
              </header>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-2">
                {s.submitter_email && <span className="inline-flex items-center gap-1"><Mail size={10} /> {s.submitter_email}</span>}
                {s.submitter_phone && <span className="inline-flex items-center gap-1"><Phone size={10} /> {s.submitter_phone}</span>}
              </div>
              {Object.entries(s.payload || {}).length > 0 && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[11px] text-accent hover:underline">
                    Ver respuestas completas
                  </summary>
                  <div className="mt-1 grid gap-0.5 rounded-md bg-bg-sunken p-2 text-[11.5px]">
                    {Object.entries(s.payload || {}).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="font-medium text-ink-3">{k}:</span>
                        <span className="min-w-0 flex-1 break-words">{String(v ?? '—')}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              <footer className="mt-2 flex items-center gap-1.5">
                {s.status === 'new' && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => convertToLead(s)}>
                      <UserPlus size={12} /> Convertir a lead
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => dismiss(s)}>
                      <XCircle size={12} /> Descartar
                    </button>
                  </>
                )}
                {s.converted_lead_id && (
                  <Link href={`/leads`} className="btn btn-ghost btn-sm">
                    <Check size={12} /> Ver lead creado
                  </Link>
                )}
                <button className="btn btn-icon btn-ghost btn-sm ml-auto" onClick={() => remove(s)} aria-label="Eliminar">
                  <Trash2 size={12} />
                </button>
              </footer>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
