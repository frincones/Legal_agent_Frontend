'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  BookOpen, FolderTree, Pin, PinOff, Plus, Search,
  Sparkles, Tag, Trash2, X, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatRelative } from '@/lib/utils';
import { useDataChangeRefresh } from '@/lib/hooks/useDataChangeRefresh';

type Entry = {
  id: string;
  title: string;
  body: string;
  kind: string;
  tags: string[];
  collection_id: string | null;
  source_matter_id: string | null;
  pinned: boolean;
  view_count: number;
  embedded: boolean;
  updated_at: string | null;
};

type Collection = {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  entry_count: number;
};

type Stats = {
  entries_total?: number;
  entries_embedded?: number;
  entries_pinned?: number;
  lessons_total?: number;
  lessons_won?: number;
  annotations_total?: number;
  collections_total?: number;
};

type SearchHit = {
  id: string;
  title: string;
  body: string;
  kind: string;
  tags: string[];
  pinned: boolean;
  rank: number;
};

const KINDS: { id: string; label: string }[] = [
  { id: 'note', label: 'Nota' },
  { id: 'precedent', label: 'Precedente' },
  { id: 'strategy', label: 'Estrategia' },
  { id: 'procedure', label: 'Procedimiento' },
  { id: 'citation_note', label: 'Nota de cita' },
  { id: 'template_comment', label: 'Comentario plantilla' },
  { id: 'lesson_learned', label: 'Lección aprendida' },
  { id: 'case_summary', label: 'Resumen de caso' },
  { id: 'contact_note', label: 'Nota de contacto' },
];

export function KBBrowser() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [filterKind, setFilterKind] = useState<string>('');
  const [filterCollection, setFilterCollection] = useState<string>('');
  const [filterPinned, setFilterPinned] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorEntry, setEditorEntry] = useState<Partial<Entry> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '60' });
      if (filterKind) params.set('kind', filterKind);
      if (filterCollection) params.set('collection_id', filterCollection);
      if (filterPinned) params.set('pinned', 'true');
      const [eRes, cRes, sRes] = await Promise.all([
        fetch(`/api/kb/entries?${params.toString()}`, { cache: 'no-store' }),
        fetch('/api/kb/collections', { cache: 'no-store' }),
        fetch('/api/kb/stats', { cache: 'no-store' }),
      ]);
      if (eRes.ok) setEntries((await eRes.json()).items || []);
      if (cRes.ok) setCollections((await cRes.json()).items || []);
      if (sRes.ok) setStats(await sRes.json());
    } finally {
      setLoading(false);
    }
  }, [filterKind, filterCollection, filterPinned]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Refresca cuando el agente añade entrada vía tool.
  useDataChangeRefresh('kb', refresh);

  async function togglePin(e: Entry) {
    const r = await fetch(`/api/kb/entries/${e.id}/${e.pinned ? 'unpin' : 'pin'}`, {
      method: 'POST',
    });
    if (r.ok) {
      setEntries((p) => p.map((x) => x.id === e.id ? { ...x, pinned: !e.pinned } : x));
    }
  }

  async function removeEntry(id: string) {
    if (!confirm('¿Eliminar entrada? Esta acción no se puede deshacer.')) return;
    const r = await fetch(`/api/kb/entries/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setEntries((p) => p.filter((x) => x.id !== id));
      toast.success('Entrada eliminada');
    }
  }

  async function runSearch(q: string) {
    if (!q.trim()) {
      setSearchHits([]);
      return;
    }
    setSearching(true);
    try {
      const r = await fetch('/api/kb/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: q.trim(), limit: 15, use_vector: true }),
      });
      if (r.ok) {
        const data = await r.json();
        setSearchHits(data.items || []);
      }
    } finally {
      setSearching(false);
    }
  }

  function openEditor(e?: Entry) {
    setEditorEntry(e ? { ...e } : { kind: 'note', tags: [], visibility: 'firm' } as any);
    setEditorOpen(true);
  }

  async function saveEditor() {
    if (!editorEntry || !editorEntry.title || !editorEntry.body) {
      toast.error('Necesitas un título y contenido');
      return;
    }
    const payload = {
      title: editorEntry.title,
      body: editorEntry.body,
      kind: editorEntry.kind || 'note',
      tags: editorEntry.tags || [],
      collection_id: editorEntry.collection_id || null,
      visibility: (editorEntry as any).visibility || 'firm',
      pinned: !!editorEntry.pinned,
    };
    const url = editorEntry.id ? `/api/kb/entries/${editorEntry.id}` : '/api/kb/entries';
    const method = editorEntry.id ? 'PATCH' : 'POST';
    const r = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      toast.success(editorEntry.id ? 'Entrada actualizada' : 'Entrada creada');
      setEditorOpen(false);
      setEditorEntry(null);
      void refresh();
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(data.detail || data.error || 'No se pudo guardar');
    }
  }

  const pinnedCount = stats.entries_pinned ?? entries.filter((e) => e.pinned).length;

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="serif text-[16px] font-semibold">Conocimiento del despacho</h2>
          <p className="text-[12px] muted">
            {stats.entries_total ?? '—'} entradas · {pinnedCount} pinneadas · {stats.lessons_total ?? '—'} lecciones de casos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
          >
            <Search size={14} /> Buscar
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openEditor()}>
            <Plus size={14} /> Nueva entrada
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-bg-elev p-2">
        <FilterChip
          label="Todos"
          active={!filterKind}
          onClick={() => setFilterKind('')}
        />
        {KINDS.map((k) => (
          <FilterChip
            key={k.id}
            label={k.label}
            active={filterKind === k.id}
            onClick={() => setFilterKind(k.id)}
          />
        ))}
        <div className="mx-1 h-4 w-px bg-line" />
        <button
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px]',
            filterPinned ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-bg-sunken',
          )}
          onClick={() => setFilterPinned((p) => !p)}
        >
          <Pin size={11} /> Solo pinneadas
        </button>
      </div>

      {/* Body · grid de entries + sidebar de collections */}
      <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-line bg-bg-elev p-2">
          <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-3">
            Colecciones
          </div>
          <button
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12.5px]',
              !filterCollection ? 'bg-bg-sunken text-ink' : 'text-ink-2 hover:bg-bg-sunken',
            )}
            onClick={() => setFilterCollection('')}
          >
            <FolderTree size={12} />
            <span className="truncate">Todas</span>
            <span className="ml-auto text-[10px] text-ink-3">{stats.entries_total ?? '—'}</span>
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12.5px]',
                filterCollection === c.id ? 'bg-bg-sunken text-ink' : 'text-ink-2 hover:bg-bg-sunken',
              )}
              onClick={() => setFilterCollection(c.id)}
            >
              <span
                className="h-2 w-2 flex-none rounded-full"
                style={{ background: colorToHex(c.color) }}
              />
              <span className="truncate">{c.name}</span>
              <span className="ml-auto text-[10px] text-ink-3">{c.entry_count}</span>
            </button>
          ))}
          <CollectionCreator onCreated={refresh} />
        </aside>

        <div className="min-w-0">
          {loading ? (
            <SkeletonGrid />
          ) : entries.length === 0 ? (
            <EmptyState onCreate={() => openEditor()} />
          ) : (
            <div className="grid gap-2">
              {entries.map((e) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  onEdit={() => openEditor(e)}
                  onTogglePin={() => togglePin(e)}
                  onRemove={() => removeEntry(e.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search dialog */}
      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-bg-overlay backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-[14%] z-50 w-[min(92vw,640px)] -translate-x-1/2 rounded-xl border border-line bg-bg shadow-2 outline-none">
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <Sparkles size={14} className="text-accent" />
              <input
                autoFocus
                placeholder="Busca por significado, no solo por palabra…"
                value={searchQ}
                onChange={(ev) => {
                  setSearchQ(ev.target.value);
                  void runSearch(ev.target.value);
                }}
                className="flex-1 bg-transparent text-[13px] outline-none"
              />
              {searching && <Loader2 size={14} className="animate-spin text-ink-3" />}
              <Dialog.Close className="btn btn-icon btn-ghost btn-sm" aria-label="Cerrar">
                <X size={14} />
              </Dialog.Close>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {searchHits.length === 0 && !searching && (
                <div className="px-3 py-6 text-center text-[12.5px] muted">
                  Escribe para buscar precedentes, estrategias y lecciones del despacho.
                </div>
              )}
              {searchHits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    setSearchOpen(false);
                    void (async () => {
                      const r = await fetch(`/api/kb/entries/${h.id}`, { cache: 'no-store' });
                      if (r.ok) openEditor(await r.json());
                    })();
                  }}
                  className="flex w-full flex-col items-start gap-1 rounded-md px-3 py-2 text-left hover:bg-bg-sunken"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium">{h.title}</span>
                    {h.pinned && <Pin size={10} className="text-accent" />}
                    <span className="chip chip-neutral">{kindLabel(h.kind)}</span>
                    <span className="ml-auto text-[10px] text-ink-3">
                      rank {h.rank.toFixed(2)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[12px] muted">{h.body}</p>
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Editor dialog */}
      <Dialog.Root open={editorOpen} onOpenChange={setEditorOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-bg-overlay backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-[8%] z-50 w-[min(96vw,720px)] -translate-x-1/2 rounded-xl border border-line bg-bg shadow-2 outline-none">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h3 className="serif text-[14px] font-semibold">
                {editorEntry?.id ? 'Editar entrada' : 'Nueva entrada KB'}
              </h3>
              <Dialog.Close className="btn btn-icon btn-ghost btn-sm" aria-label="Cerrar">
                <X size={14} />
              </Dialog.Close>
            </header>
            <div className="grid gap-3 p-4">
              <input
                placeholder="Título · breve y reconocible"
                value={editorEntry?.title || ''}
                onChange={(ev) => setEditorEntry((p) => ({ ...(p || {}), title: ev.target.value }))}
                className="input"
              />
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={editorEntry?.kind || 'note'}
                  onChange={(ev) => setEditorEntry((p) => ({ ...(p || {}), kind: ev.target.value }))}
                >
                  {KINDS.map((k) => (
                    <option key={k.id} value={k.id}>{k.label}</option>
                  ))}
                </select>
                <select
                  className="input flex-1"
                  value={editorEntry?.collection_id || ''}
                  onChange={(ev) => setEditorEntry((p) => ({ ...(p || {}), collection_id: ev.target.value || null }))}
                >
                  <option value="">Sin colección</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Contenido · cita normas y casos cuando sea útil"
                rows={10}
                value={editorEntry?.body || ''}
                onChange={(ev) => setEditorEntry((p) => ({ ...(p || {}), body: ev.target.value }))}
                className="input min-h-[200px] resize-y"
              />
              <TagInput
                tags={editorEntry?.tags || []}
                onChange={(tags) => setEditorEntry((p) => ({ ...(p || {}), tags }))}
              />
              <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
                <input
                  type="checkbox"
                  checked={!!editorEntry?.pinned}
                  onChange={(ev) => setEditorEntry((p) => ({ ...(p || {}), pinned: ev.target.checked }))}
                />
                Fijar en la parte superior (pin)
              </label>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
              <Dialog.Close asChild>
                <button className="btn btn-ghost btn-sm">Cancelar</button>
              </Dialog.Close>
              <button className="btn btn-primary btn-sm" onClick={saveEditor}>
                {editorEntry?.id ? 'Guardar cambios' : 'Crear entrada'}
              </button>
            </footer>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ----------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md px-2 py-1 text-[11.5px]',
        active ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-bg-sunken hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}

function EntryRow({
  entry, onEdit, onTogglePin, onRemove,
}: {
  entry: Entry;
  onEdit: () => void;
  onTogglePin: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="group surface flex flex-col gap-1.5 p-[14px]">
      <header className="flex items-start gap-2">
        <BookOpen size={14} className="mt-0.5 text-ink-3" />
        <button onClick={onEdit} className="min-w-0 flex-1 text-left">
          <h3 className="truncate text-[13.5px] font-medium">{entry.title}</h3>
        </button>
        <span className="chip chip-neutral">{kindLabel(entry.kind)}</span>
        {entry.embedded ? (
          <span className="chip chip-green">
            <Sparkles size={9} /> RAG
          </span>
        ) : (
          <span className="chip chip-warning">RAG pendiente</span>
        )}
        <button
          onClick={onTogglePin}
          className="btn btn-icon btn-ghost btn-sm"
          aria-label={entry.pinned ? 'Quitar pin' : 'Fijar'}
        >
          {entry.pinned ? <Pin size={12} className="text-accent" /> : <PinOff size={12} />}
        </button>
        <button onClick={onRemove} className="btn btn-icon btn-ghost btn-sm" aria-label="Eliminar">
          <Trash2 size={12} />
        </button>
      </header>
      <p className="line-clamp-2 text-[12.5px] text-ink-2">{entry.body}</p>
      <footer className="flex flex-wrap items-center gap-2 text-[11px] muted">
        {(entry.tags || []).slice(0, 6).map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-bg-sunken px-1.5 py-0.5">
            <Tag size={9} /> {t}
          </span>
        ))}
        <span className="ml-auto">
          {entry.view_count} vistas · {entry.updated_at ? formatRelative(entry.updated_at) : '—'}
        </span>
      </footer>
    </article>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-2 p-10 text-center">
      <BookOpen size={28} className="text-ink-3" />
      <h3 className="text-[14px] font-medium">Aún no hay entradas</h3>
      <p className="max-w-md text-[12.5px] muted">
        La memoria del despacho se construye guardando precedentes, estrategias y
        notas que después puedes recuperar por significado, no solo por palabra.
      </p>
      <button className="btn btn-primary btn-sm" onClick={onCreate}>
        <Plus size={14} /> Crear primera entrada
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="surface flex h-[72px] animate-pulse flex-col gap-1.5 p-[14px]">
          <div className="h-3 w-1/2 rounded bg-bg-sunken" />
          <div className="h-2 w-3/4 rounded bg-bg-sunken" />
        </div>
      ))}
    </div>
  );
}

function CollectionCreator({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  async function save() {
    if (!name.trim()) return;
    const r = await fetch('/api/kb/collections', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (r.ok) {
      setName(''); setOpen(false); onCreated();
    }
  }
  if (!open) {
    return (
      <button
        className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] text-ink-3 hover:bg-bg-sunken hover:text-ink"
        onClick={() => setOpen(true)}
      >
        <Plus size={11} /> Nueva colección
      </button>
    );
  }
  return (
    <div className="mt-1 flex gap-1">
      <input
        autoFocus
        placeholder="Nombre…"
        value={name}
        onChange={(ev) => setName(ev.target.value)}
        onKeyDown={(ev) => ev.key === 'Enter' && void save()}
        className="input flex-1 text-[12px]"
      />
      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Cancelar">
        <X size={12} />
      </button>
    </div>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState('');
  function add() {
    const v = draft.trim().toLowerCase();
    if (!v) return;
    if (!tags.includes(v)) onChange([...tags, v]);
    setDraft('');
  }
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-line bg-bg-elev px-2 py-1.5">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-bg-sunken px-1.5 py-0.5 text-[11px]">
          {t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label="Quitar tag">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        placeholder="Añade tag y enter"
        value={draft}
        onChange={(ev) => setDraft(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter') { ev.preventDefault(); add(); }
          if (ev.key === 'Backspace' && !draft && tags.length) onChange(tags.slice(0, -1));
        }}
        className="flex-1 min-w-[120px] bg-transparent text-[12px] outline-none"
      />
    </div>
  );
}

function kindLabel(k: string): string {
  return KINDS.find((x) => x.id === k)?.label || k;
}

function colorToHex(color: string): string {
  const map: Record<string, string> = {
    blue: 'rgb(96,165,250)',
    green: 'rgb(74,222,128)',
    yellow: 'rgb(250,204,21)',
    red: 'rgb(248,113,113)',
    purple: 'rgb(192,132,252)',
    orange: 'rgb(251,146,60)',
    gray: 'rgb(148,163,184)',
  };
  return map[color] ?? map.blue ?? 'rgb(96,165,250)';
}
