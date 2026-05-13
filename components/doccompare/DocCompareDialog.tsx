'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { GitCompare, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type DocOpt = { id: string; titulo: string };

type Result = {
  id: string;
  added_blocks: number;
  removed_blocks: number;
  changed_blocks: number;
  semantic_summary: string;
  diff_html?: string;
  diff_json?: Array<{ op: 'equal' | 'insert' | 'delete' | 'change'; text?: string; a?: string; b?: string }>;
};

export function DocCompareDialog({
  open,
  onOpenChange,
  documents,
  initialA,
  initialB,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  documents: DocOpt[];
  initialA?: string;
  initialB?: string;
}) {
  const [docA, setDocA] = useState(initialA || documents[0]?.id || '');
  const [docB, setDocB] = useState(initialB || documents[1]?.id || '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    if (!docA || !docB || docA === docB) {
      toast.error('Selecciona dos documentos distintos');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch('/api/doc-compare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ document_a_id: docA, document_b_id: docB }),
      });
      if (!r.ok) throw new Error(await r.text());
      const created = await r.json();
      // Cargar detalle con diff_json
      const det = await fetch(`/api/doc-compare/${created.id}`, { cache: 'no-store' });
      if (det.ok) setResult(await det.json());
      else setResult(created);
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[900px] max-w-[96vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="serif text-[18px] font-semibold inline-flex items-center gap-2">
                <GitCompare size={18} className="text-accent" aria-hidden="true" />
                Comparar documentos
              </Dialog.Title>
              <p className="text-[12px] muted">Diff inteligente + resumen narrativo</p>
            </div>
            <button className="btn" onClick={() => onOpenChange(false)}><X size={14} aria-hidden="true" /></button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Documento A">
              <select value={docA} onChange={(e) => setDocA(e.target.value)} className="w-full bg-transparent outline-none">
                {documents.map((d) => (<option key={d.id} value={d.id}>{d.titulo}</option>))}
              </select>
            </Field>
            <Field label="Documento B">
              <select value={docB} onChange={(e) => setDocB(e.target.value)} className="w-full bg-transparent outline-none">
                {documents.map((d) => (<option key={d.id} value={d.id}>{d.titulo}</option>))}
              </select>
            </Field>
          </div>

          <div className="mt-3 flex justify-end">
            <button className="btn btn-primary" onClick={run} disabled={busy || !docA || !docB || docA === docB}>
              {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
              Comparar
            </button>
          </div>

          {result && (
            <div className="mt-5 grid gap-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Tile label="Agregados" v={result.added_blocks} color="emerald" />
                <Tile label="Eliminados" v={result.removed_blocks} color="red" />
                <Tile label="Cambiados" v={result.changed_blocks} color="amber" />
              </div>
              {result.semantic_summary && (
                <div className="surface p-3">
                  <div className="text-[11px] uppercase tracking-wider muted">Resumen narrativo</div>
                  <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap">{result.semantic_summary}</p>
                </div>
              )}
              {result.diff_json && (
                <section>
                  <div className="mb-1 text-[11px] uppercase tracking-wider muted">Diff por bloques</div>
                  <ul className="grid gap-1.5 text-[12px]">
                    {result.diff_json.map((d, i) => {
                      if (d.op === 'equal') {
                        return (
                          <li key={i} className="muted line-clamp-2 pl-3 border-l border-line">{d.text}</li>
                        );
                      }
                      if (d.op === 'insert') {
                        return (
                          <li key={i} className="rounded bg-emerald-500/10 border border-emerald-500/30 p-2">
                            <span className="font-mono text-emerald-500 mr-2">+</span>
                            {d.text}
                          </li>
                        );
                      }
                      if (d.op === 'delete') {
                        return (
                          <li key={i} className="rounded bg-red-500/10 border border-red-500/30 p-2 line-through opacity-80">
                            <span className="font-mono text-red-500 mr-2 no-underline">−</span>
                            {d.text}
                          </li>
                        );
                      }
                      // change
                      return (
                        <li key={i} className="rounded border border-amber-500/30 p-2">
                          <div className="bg-red-500/10 p-1 mb-1 rounded line-through opacity-80">
                            <span className="font-mono text-red-500 mr-2 no-underline">−</span>{d.a}
                          </div>
                          <div className="bg-emerald-500/10 p-1 rounded">
                            <span className="font-mono text-emerald-500 mr-2">+</span>{d.b}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
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

function Tile({ label, v, color }: { label: string; v: number; color: 'emerald' | 'red' | 'amber' }) {
  const cls = {
    emerald: 'border-emerald-500/30 text-emerald-500',
    red: 'border-red-500/30 text-red-500',
    amber: 'border-amber-500/30 text-amber-500',
  }[color];
  return (
    <div className={cn('surface p-3', cls)}>
      <div className="text-[10.5px] uppercase tracking-wider muted">{label}</div>
      <div className="serif text-[22px] font-semibold">{v}</div>
    </div>
  );
}
