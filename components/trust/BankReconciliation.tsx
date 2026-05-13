'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CheckCircle2, FileUp, Link2, Loader2, Sparkles, Unlink, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCOP } from '@/lib/utils';

type Statement = {
  id: string;
  trust_account_id: string;
  period_start: string;
  period_end: string;
  opening_balance_cop: number;
  closing_balance_cop: number;
  source_filename: string;
  imported_at: string;
  line_count: number;
  unmatched_count: number;
};

type Line = {
  id: string;
  occurred_on: string;
  amount_cop: number;
  description: string;
  reference: string | null;
  matched_transaction_id: string | null;
  match_confidence: number | null;
  match_method: string | null;
};

type Candidate = {
  id: string;
  occurred_on: string;
  amount_cop: number;
  direction: 'in' | 'out';
  kind: string;
  description: string;
  reference: string | null;
  matter_id: string | null;
  signed_amount: number;
};

type Account = { id: string; name: string };

export function BankReconciliation({ onChange }: { onChange?: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [openStatement, setOpenStatement] = useState<string | null>(null);
  const [openUpload, setOpenUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ac, st] = await Promise.all([
        fetch('/api/trust/accounts', { cache: 'no-store' }),
        fetch('/api/trust/reconciliation/statements', { cache: 'no-store' }),
      ]);
      if (ac.ok) setAccounts((await ac.json()).items || []);
      if (st.ok) setStatements((await st.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <div className="grid gap-3">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="serif text-[15px] font-semibold">Conciliación bancaria</h3>
          <p className="text-[12px] muted">Sube el extracto CSV del banco y matchea con los movimientos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpenUpload(true)}>
          <Upload size={14} aria-hidden="true" /> Subir extracto
        </button>
      </header>

      {loading ? (
        <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : statements.length === 0 ? (
        <div className="surface p-6 text-center text-[12.5px] muted">
          Sin extractos importados. Sube el primero (CSV) para empezar.
        </div>
      ) : (
        <div className="grid gap-2">
          {statements.map((s) => {
            const acct = accounts.find((a) => a.id === s.trust_account_id);
            const pct = s.line_count ? Math.round(((s.line_count - s.unmatched_count) / s.line_count) * 100) : 0;
            return (
              <button
                key={s.id}
                onClick={() => setOpenStatement(s.id)}
                className="surface flex items-center justify-between gap-3 p-3 text-left transition-colors hover:border-accent"
              >
                <div>
                  <div className="text-[13px] font-semibold">{acct?.name || '—'}</div>
                  <div className="text-[11.5px] muted">
                    {s.period_start} → {s.period_end} · {s.line_count} líneas · {s.source_filename}
                  </div>
                </div>
                <div className="text-right">
                  <div className="serif text-[14px] font-semibold">{formatCOP(s.closing_balance_cop)}</div>
                  <div className={cn(
                    'text-[11px]',
                    pct === 100 ? 'text-emerald-500' : pct > 50 ? 'text-amber-500' : 'text-red-500',
                  )}>
                    {pct}% conciliado · {s.unmatched_count} sin match
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {openStatement && (
        <StatementDetail
          statementId={openStatement}
          onClose={() => { setOpenStatement(null); void refresh(); onChange?.(); }}
        />
      )}

      <UploadDialog open={openUpload} onOpenChange={setOpenUpload} accounts={accounts} onUploaded={refresh} />
    </div>
  );
}

function StatementDetail({ statementId, onClose }: { statementId: string; onClose: () => void }) {
  const [data, setData] = useState<{ statement: Statement; lines: Line[]; candidates: Candidate[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/trust/reconciliation/statements/${statementId}`, { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [statementId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function autoMatch() {
    setBusy(true);
    try {
      const r = await fetch(`/api/trust/reconciliation/statements/${statementId}/auto-match`, { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`Auto-match: ${d.matched} líneas`);
      await refresh();
    } catch {
      toast.error('Error');
    } finally {
      setBusy(false);
    }
  }

  async function manualMatch(lineId: string, txId: string) {
    const r = await fetch(`/api/trust/reconciliation/lines/${lineId}/match`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ transaction_id: txId }),
    });
    if (r.ok) { toast.success('Match registrado'); await refresh(); }
    else toast.error('Error');
  }

  async function unmatch(lineId: string) {
    const r = await fetch(`/api/trust/reconciliation/lines/${lineId}/unmatch`, { method: 'POST' });
    if (r.ok) { toast.success('Desmatcheado'); await refresh(); }
  }

  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[920px] max-w-[96vw] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[17px] font-semibold">Conciliación de extracto</Dialog.Title>
          {loading || !data ? (
            <div className="mt-4 flex items-center gap-2 text-[12.5px] muted">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[12.5px] muted">
                  {data.statement.period_start} → {data.statement.period_end}
                </div>
                <button className="btn btn-primary" onClick={autoMatch} disabled={busy}>
                  {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Sparkles size={12} aria-hidden="true" />}
                  Auto-match
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <section>
                  <h4 className="mb-1 text-[11px] uppercase tracking-wider muted">Líneas del extracto ({data.lines.length})</h4>
                  <ul className="grid gap-1">
                    {data.lines.map((l) => (
                      <li key={l.id} className={cn(
                        'rounded-md border p-2 text-[12px]',
                        l.matched_transaction_id ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-line',
                      )}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate flex-1">{l.description}</span>
                          <span className={cn('mono font-semibold', l.amount_cop > 0 ? 'text-emerald-500' : 'text-red-500')}>
                            {l.amount_cop > 0 ? '+' : ''}{formatCOP(l.amount_cop)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10.5px] muted flex items-center justify-between">
                          <span>{l.occurred_on} {l.reference && `· ${l.reference}`}</span>
                          {l.matched_transaction_id ? (
                            <button onClick={() => unmatch(l.id)} className="inline-flex items-center gap-1 text-emerald-500 hover:underline">
                              <CheckCircle2 size={10} aria-hidden="true" />
                              {l.match_method || 'match'}
                              <Unlink size={10} aria-hidden="true" />
                            </button>
                          ) : (
                            <span>sin match</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h4 className="mb-1 text-[11px] uppercase tracking-wider muted">Movimientos disponibles ({data.candidates.length})</h4>
                  <ul className="grid gap-1">
                    {data.candidates.map((c) => (
                      <li key={c.id} className="rounded-md border border-line p-2 text-[12px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate flex-1">{c.description || c.kind}</span>
                          <span className={cn('mono font-semibold', c.direction === 'in' ? 'text-emerald-500' : 'text-red-500')}>
                            {c.direction === 'in' ? '+' : '−'}{formatCOP(c.amount_cop)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between text-[10.5px] muted">
                          <span>{c.occurred_on} · {c.kind}</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) manualMatch(e.target.value, c.id);
                              e.currentTarget.value = '';
                            }}
                            className="rounded border border-line bg-bg-elev px-1 py-0.5 text-[10.5px]"
                            defaultValue=""
                          >
                            <option value="">Match con línea…</option>
                            {data.lines.filter((l) => !l.matched_transaction_id).map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.occurred_on} · {formatCOP(l.amount_cop)} · {l.description.slice(0, 30)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function UploadDialog({
  open, onOpenChange, accounts, onUploaded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accounts: Account[];
  onUploaded: () => void;
}) {
  const [trustAccountId, setTrustAccountId] = useState(accounts[0]?.id || '');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && accounts[0]?.id) setTrustAccountId(accounts[0].id);
  }, [open, accounts]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error('Selecciona el CSV del extracto');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('trust_account_id', trustAccountId);
      fd.append('period_start', periodStart);
      fd.append('period_end', periodEnd);
      fd.append('file', file);
      const r = await fetch('/api/trust/reconciliation/statements', { method: 'POST', body: fd });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`Importado: ${d.lines_imported} líneas`);
      onUploaded();
      onOpenChange(false);
      setFile(null); setPeriodStart(''); setPeriodEnd('');
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 surface p-5">
          <Dialog.Title className="serif text-[16px] font-semibold">Importar extracto bancario</Dialog.Title>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <Field label="Cuenta">
              <select required value={trustAccountId} onChange={(e) => setTrustAccountId(e.target.value)} className="w-full bg-transparent outline-none">
                {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Desde">
                <input type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-full bg-transparent outline-none" />
              </Field>
              <Field label="Hasta">
                <input type="date" required value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-full bg-transparent outline-none" />
              </Field>
            </div>
            <Field label="Archivo CSV (columnas: fecha, descripción, monto, [referencia])">
              <input type="file" required accept=".csv,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-[12px]" />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy || !file}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <FileUp size={12} aria-hidden="true" />}
                Importar
              </button>
            </div>
          </form>
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
