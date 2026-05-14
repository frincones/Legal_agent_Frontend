'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  CheckCircle2, FileUp, Loader2, Play, Plus, RefreshCcw, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type Job = {
  id: string;
  kind: string;
  source_filename: string;
  status: string;
  rows_total: number;
  rows_ok: number;
  rows_error: number;
  rows_warnings: number;
  completed_at: string | null;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  clients: 'Clientes',
  matters: 'Casos',
  leads: 'Leads',
  time_entries: 'Horas',
  expenses: 'Gastos',
};

const STATUS_META: Record<string, { cls: string }> = {
  pending: { cls: 'border-line text-ink-3' },
  validating: { cls: 'border-blue-500/40 text-blue-500' },
  validated: { cls: 'border-amber-500/40 text-amber-500' },
  committing: { cls: 'border-blue-500/40 text-blue-500' },
  committed: { cls: 'border-emerald-500/40 text-emerald-500' },
  failed: { cls: 'border-red-500/40 text-red-500' },
  canceled: { cls: 'border-line text-ink-3 line-through' },
};

export function ImportsManager() {
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [openWizard, setOpenWizard] = useState(false);
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/imports?limit=100', { cache: 'no-store' });
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
          <h2 className="serif text-[16px] font-semibold">Importadores CSV</h2>
          <p className="text-[12px] muted">Migra clientes / casos / horas desde Excel · Lex Doctor · Clio.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={refresh}>
            <RefreshCcw size={12} aria-hidden="true" /> Refrescar
          </button>
          <button className="btn btn-primary" onClick={() => setOpenWizard(true)}>
            <Plus size={14} aria-hidden="true" /> Nueva importación
          </button>
        </div>
      </header>

      {loading ? (
        <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="surface p-6 text-center text-[12.5px] muted">
          Sin importaciones. Crea la primera para migrar datos masivos.
        </div>
      ) : (
        <div className="surface overflow-x-auto p-2">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                <th className="py-2">Archivo</th>
                <th className="py-2">Tipo</th>
                <th className="py-2 text-right">Total</th>
                <th className="py-2 text-right">OK</th>
                <th className="py-2 text-right">Error</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Creado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((j) => {
                const m = STATUS_META[j.status] || { cls: 'border-line' };
                return (
                  <tr key={j.id} className="border-t border-line text-[12.5px] hover:bg-bg-elev cursor-pointer" onClick={() => setOpenDetail(j.id)}>
                    <td className="py-2.5 font-semibold truncate max-w-[260px]">{j.source_filename || '—'}</td>
                    <td className="py-2.5 muted">{KIND_LABEL[j.kind] || j.kind}</td>
                    <td className="py-2.5 text-right mono">{j.rows_total}</td>
                    <td className="py-2.5 text-right mono text-emerald-500">{j.rows_ok}</td>
                    <td className="py-2.5 text-right mono text-red-500">{j.rows_error}</td>
                    <td className="py-2.5">
                      <span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold', m.cls)}>
                        {j.status}
                      </span>
                    </td>
                    <td className="py-2.5 muted">{formatRelative(j.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ImportWizard open={openWizard} onOpenChange={setOpenWizard} onCreated={refresh} />
      {openDetail && (
        <ImportDetail jobId={openDetail} onClose={() => { setOpenDetail(null); void refresh(); }} />
      )}
    </div>
  );
}

function ImportWizard({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [kind, setKind] = useState('clients');
  const [file, setFile] = useState<File | null>(null);
  const [columnMapping, setColumnMapping] = useState('{}');
  const [fields, setFields] = useState<Record<string, any> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/imports/fields/${kind}`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setFields(d.fields))
      .catch(() => {});
  }, [open, kind]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error('Selecciona el CSV'); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('kind', kind);
      fd.append('file', file);
      if (columnMapping.trim() && columnMapping.trim() !== '{}') {
        fd.append('column_mapping', columnMapping);
      }
      const r = await fetch('/api/imports/upload', { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`Subido · ${d.rows_total} filas. Ahora valida antes de commit.`);
      onCreated();
      onOpenChange(false);
      setFile(null); setColumnMapping('{}');
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[560px] max-w-[94vw] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[17px] font-semibold">Nueva importación CSV</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Tipo">
              <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full bg-transparent outline-none">
                <option value="clients">Clientes</option>
                <option value="matters">Casos</option>
                <option value="leads">Leads</option>
                <option value="time_entries">Horas</option>
                <option value="expenses">Gastos</option>
              </select>
            </Field>
            <Field label="Archivo CSV">
              <input type="file" accept=".csv,.txt" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-[12px]" />
            </Field>
            {fields && (
              <section className="rounded-md border border-line bg-bg-elev p-3 text-[12px]">
                <div className="mb-1 font-semibold">Campos disponibles para {KIND_LABEL[kind]}:</div>
                <ul className="grid grid-cols-2 gap-1 mono text-[11px] muted">
                  {Object.entries(fields).map(([f, spec]: [string, any]) => (
                    <li key={f}>
                      {spec.required && <span className="text-red-500">*</span>}
                      {f}
                      <span className="text-[10px]"> ({spec.type})</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] muted">
                  Si los nombres de columnas del CSV coinciden con los campos (con / sin tildes,
                  espacios → guiones bajos), el mapping es automático.
                </p>
              </section>
            )}
            <Field label="Mapping manual (JSON, opcional)">
              <textarea
                rows={3}
                value={columnMapping}
                onChange={(e) => setColumnMapping(e.target.value)}
                placeholder='{"Nombre del Cliente": "nombre", "NIT": "tax_id"}'
                className="w-full bg-transparent outline-none font-mono text-[11px]"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy || !file}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <FileUp size={12} aria-hidden="true" />}
                Subir
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ImportDetail({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'validate' | 'commit' | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/imports/${jobId}`, { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function action(verb: 'validate' | 'commit') {
    setBusy(verb);
    try {
      const r = await fetch(`/api/imports/${jobId}/${verb}`, { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`${verb === 'validate' ? 'Validación' : 'Commit'}: ${d.rows_ok ?? 0} OK · ${d.rows_error ?? 0} error`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message.slice(0, 200) : 'Error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[820px] max-w-[96vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[17px] font-semibold">Detalle de importación</Dialog.Title>
          {loading || !data ? (
            <div className="mt-3 flex items-center gap-2 text-[12.5px] muted">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                <Cell label="Archivo" v={data.job.source_filename || '—'} />
                <Cell label="Tipo" v={KIND_LABEL[data.job.kind] || data.job.kind} />
                <Cell label="Estado" v={<span className="capitalize">{data.job.status}</span>} />
                <Cell label="Total" v={data.job.rows_total} />
                <Cell label="OK" v={<span className="text-emerald-500">{data.job.rows_ok}</span>} />
                <Cell label="Error" v={<span className="text-red-500">{data.job.rows_error}</span>} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {(data.job.status === 'pending' || data.job.status === 'validated') && (
                  <button className="btn btn-primary" onClick={() => action('validate')} disabled={!!busy}>
                    {busy === 'validate' ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
                    Validar (dry-run)
                  </button>
                )}
                {data.job.status === 'validated' && data.job.rows_ok > 0 && (
                  <button className="btn btn-primary" onClick={() => action('commit')} disabled={!!busy}>
                    {busy === 'commit' ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={12} aria-hidden="true" />}
                    Confirmar e insertar
                  </button>
                )}
              </div>

              {data.job.column_mapping && Object.keys(data.job.column_mapping).length > 0 && (
                <section className="mt-4">
                  <h3 className="mb-1 text-[11px] uppercase tracking-wider muted">Mapping de columnas</h3>
                  <ul className="grid gap-1 text-[12px] mono">
                    {Object.entries(data.job.column_mapping).map(([k, v]) => (
                      <li key={k}><strong>{k}</strong> → {v as string}</li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mt-4">
                <h3 className="mb-1 text-[11px] uppercase tracking-wider muted">Muestra de filas (errores primero)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[10.5px] uppercase tracking-wider muted">
                        <th className="py-2">#</th>
                        <th className="py-2">Estado</th>
                        <th className="py-2">Error</th>
                        <th className="py-2">Raw</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sample_rows.map((r: any, i: number) => (
                        <tr key={i} className="border-t border-line text-[11px]">
                          <td className="py-1.5 mono">{r.line_number}</td>
                          <td className="py-1.5">
                            <span className={cn(
                              'inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                              r.status === 'ok' && 'border-emerald-500/40 text-emerald-500',
                              r.status === 'error' && 'border-red-500/40 text-red-500',
                              r.status === 'pending' && 'border-line',
                            )}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-1.5 text-red-500 truncate max-w-[200px]">{r.error || '—'}</td>
                          <td className="py-1.5 mono truncate max-w-[300px]">
                            {JSON.stringify(r.raw_payload).slice(0, 80)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wider muted">{label}</label>
      <div className="rounded-md border border-line bg-bg-elev p-[10px] text-[13px] focus-within:border-accent">{children}</div>
    </div>
  );
}

function Cell({ label, v }: { label: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-bg-elev p-2">
      <div className="text-[10.5px] uppercase tracking-wider muted">{label}</div>
      <div className="mt-0.5 truncate">{v}</div>
    </div>
  );
}
