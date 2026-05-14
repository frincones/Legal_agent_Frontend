'use client';

import { useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  BookOpen, ChevronRight, Download, GitFork, Loader2, Search, Send,
  Sparkles, Star, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';

type TemplateItem = {
  id: string;
  name: string;
  doc_type: string;
  category: string;
  jurisdiction: string;
  description: string | null;
  variables: string[];
  downloads: number;
  stars: number;
  forks: number;
  is_official: boolean;
  starred_by_me: boolean;
  created_at: string;
};

const CATEGORIES = ['general', 'civil', 'laboral', 'comercial', 'administrativo', 'familia', 'penal', 'constitucional'];

export function MarketplaceBrowser() {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('popular');
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const [openSubmit, setOpenSubmit] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: '50' });
      if (category) params.set('category', category);
      if (q.trim()) params.set('q', q.trim());
      const r = await fetch(`/api/marketplace/templates?${params.toString()}`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [sort, category, q]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function toggleStar(t: TemplateItem) {
    const method = t.starred_by_me ? 'DELETE' : 'POST';
    const r = await fetch(`/api/marketplace/templates/${t.id}/star`, { method });
    if (r.ok) {
      setItems((p) => p.map((x) => x.id === t.id
        ? { ...x, starred_by_me: !t.starred_by_me, stars: x.stars + (t.starred_by_me ? -1 : 1) }
        : x));
    }
  }

  async function fork(t: TemplateItem) {
    const r = await fetch(`/api/marketplace/templates/${t.id}/fork`, { method: 'POST' });
    if (r.ok) {
      toast.success(`"${t.name}" copiada a tus plantillas. Ve a Settings → Plantillas.`);
      setItems((p) => p.map((x) => x.id === t.id ? { ...x, forks: x.forks + 1, downloads: x.downloads + 1 } : x));
    }
  }

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="serif text-[16px] font-semibold">Marketplace de plantillas</h2>
          <p className="text-[12px] muted">
            Plantillas oficiales LexAI + aportes de la comunidad. Forka a tu firma con 1 click.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpenSubmit(true)}>
          <Send size={14} aria-hidden="true" /> Proponer plantilla
        </button>
      </header>

      <div className="surface flex flex-wrap items-center gap-2 p-3">
        <div className="flex flex-1 items-center gap-2 min-w-[200px]">
          <Search size={14} className="text-ink-3" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            className="flex-1 bg-transparent text-[13px] outline-none"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-line bg-bg-elev px-2 py-1 text-[12.5px]">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-line bg-bg-elev px-2 py-1 text-[12.5px]">
          <option value="popular">Populares</option>
          <option value="recent">Recientes</option>
          <option value="stars">Más estrellas</option>
        </select>
      </div>

      {loading ? (
        <div className="surface flex items-center gap-2 p-3 text-[12.5px] muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="surface p-6 text-center text-[12.5px] muted">
          Sin plantillas con esos filtros.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <article key={t.id} className="surface flex flex-col p-3 transition-colors hover:border-accent">
              <div className="flex items-start gap-2">
                <BookOpen size={14} className="mt-1 flex-none text-accent" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <strong className="text-[13px] truncate">{t.name}</strong>
                    {t.is_official && (
                      <span className="rounded border border-accent/40 bg-accent/10 px-1 py-0.5 text-[9.5px] font-semibold text-accent">
                        OFICIAL
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[10.5px] muted capitalize">
                    {t.doc_type} · {t.category}
                    {t.jurisdiction !== 'colombia' && ` · ${t.jurisdiction}`}
                  </div>
                </div>
              </div>
              {t.description && (
                <p className="mt-2 line-clamp-2 text-[12px] muted">{t.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {t.variables.slice(0, 4).map((v) => (
                  <span key={v} className="rounded bg-bg-elev px-1 py-0.5 text-[10px] mono">{v}</span>
                ))}
                {t.variables.length > 4 && <span className="text-[10.5px] muted">+{t.variables.length - 4}</span>}
              </div>
              <div className="mt-auto flex items-center justify-between pt-3 text-[11px] muted">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Star size={11} className={t.starred_by_me ? 'fill-amber-500 text-amber-500' : ''} aria-hidden="true" /> {t.stars}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitFork size={11} aria-hidden="true" /> {t.forks}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Download size={11} aria-hidden="true" /> {t.downloads}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                <button className="btn flex-1" onClick={() => toggleStar(t)}>
                  <Star size={11} className={t.starred_by_me ? 'fill-amber-500 text-amber-500' : ''} aria-hidden="true" />
                  {t.starred_by_me ? 'Quitar' : 'Star'}
                </button>
                <button className="btn flex-1" onClick={() => setOpenDetail(t.id)}>
                  Ver
                </button>
                <button className="btn btn-primary flex-1" onClick={() => fork(t)}>
                  <GitFork size={11} aria-hidden="true" /> Fork
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {openDetail && (
        <DetailDialog
          templateId={openDetail}
          onClose={() => setOpenDetail(null)}
          onForked={refresh}
        />
      )}
      <SubmitDialog open={openSubmit} onOpenChange={setOpenSubmit} onSubmitted={refresh} />
    </div>
  );
}

function DetailDialog({
  templateId, onClose, onForked,
}: {
  templateId: string;
  onClose: () => void;
  onForked: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/marketplace/templates/${templateId}`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [templateId]);

  async function fork() {
    setBusy(true);
    try {
      const r = await fetch(`/api/marketplace/templates/${templateId}/fork`, { method: 'POST' });
      if (r.ok) {
        toast.success('Forked a tus plantillas');
        onForked();
        onClose();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={true} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[760px] max-w-[96vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <div className="flex items-start justify-between">
            <Dialog.Title className="serif text-[18px] font-semibold">
              {loading || !data ? 'Cargando…' : data.name}
            </Dialog.Title>
            <button className="btn" onClick={onClose}><X size={14} aria-hidden="true" /></button>
          </div>
          {!loading && data && (
            <>
              <div className="mt-2 flex items-center gap-2 text-[11.5px] muted">
                <span className="capitalize">{data.doc_type} · {data.category}</span>
                {data.is_official && (
                  <span className="rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    OFICIAL
                  </span>
                )}
                <span>· {data.stars} ★ · {data.forks} forks · {data.downloads} downloads</span>
              </div>
              {data.description && <p className="mt-3 text-[12.5px]">{data.description}</p>}
              {data.variables?.length > 0 && (
                <div className="mt-3">
                  <div className="text-[11px] uppercase tracking-wider muted">Variables</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {data.variables.map((v: string) => (
                      <span key={v} className="rounded bg-bg-elev px-2 py-0.5 text-[11px] mono">{`{{${v}}}`}</span>
                    ))}
                  </div>
                </div>
              )}
              <pre className="mt-4 rounded border border-line bg-bg-elev p-3 text-[11.5px] whitespace-pre-wrap font-mono max-h-[400px] overflow-auto">
                {data.body}
              </pre>
              <div className="mt-4 flex justify-end gap-2">
                <button className="btn" onClick={onClose}>Cerrar</button>
                <button className="btn btn-primary" onClick={fork} disabled={busy}>
                  {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <GitFork size={12} aria-hidden="true" />}
                  Forkar a mi firma
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SubmitDialog({
  open, onOpenChange, onSubmitted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmitted: () => void;
}) {
  const [name, setName] = useState('');
  const [docType, setDocType] = useState('');
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/marketplace/templates/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, doc_type: docType, category, description, body }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`Propuesta enviada · ${d.variables_detected?.length || 0} variables detectadas`);
      onSubmitted();
      onOpenChange(false);
      setName(''); setDocType(''); setCategory('general'); setDescription(''); setBody('');
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[640px] max-w-[96vw] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
          <Dialog.Title className="serif text-[17px] font-semibold inline-flex items-center gap-2">
            <Sparkles size={16} className="text-accent" aria-hidden="true" />
            Proponer plantilla al marketplace
          </Dialog.Title>
          <p className="mt-1 text-[12px] muted">
            Será revisada manualmente antes de aparecer en el marketplace público. Las variables se
            detectan automáticamente con la sintaxis <code>{`{{nombre_variable}}`}</code>.
          </p>
          <form onSubmit={submit} className="mt-3 grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Nombre">
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent outline-none" />
              </Field>
              <Field label="Tipo de doc">
                <input required value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="tutela, contrato, demanda…" className="w-full bg-transparent outline-none" />
              </Field>
            </div>
            <Field label="Categoría">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-transparent outline-none">
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </Field>
            <Field label="Descripción">
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent outline-none" />
            </Field>
            <Field label="Cuerpo de la plantilla (usa {{variables}})">
              <textarea required rows={10} value={body} onChange={(e) => setBody(e.target.value)} className="w-full bg-transparent outline-none text-[12px] mono" />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Send size={12} aria-hidden="true" />}
                Enviar a revisión
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
