'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bookmark, Pin, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SavedFilter = {
  id: string;
  scope: string;
  name: string;
  filters: Record<string, unknown>;
  pinned: boolean;
  sort_order: number;
};

/**
 * Sprint 17 · Barra de vistas guardadas.
 *
 * Renderiza chips de filtros guardados para el `scope` dado y emite
 * `onApply(filters)` cuando se elige uno. Permite guardar el filtro
 * actual con un nombre, pinearlo y borrarlo.
 *
 * El padre maneja qué es "el filtro actual" para guardar.
 */
export function SavedFiltersBar({
  scope,
  currentFilters,
  onApply,
  className,
}: {
  scope: 'matters' | 'activity' | 'tasks' | 'documents' | 'kb';
  currentFilters: Record<string, unknown>;
  onApply: (filters: Record<string, unknown>) => void;
  className?: string;
}) {
  const [items, setItems] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');
  const [pinned, setPinned] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/saved-filters?scope=${scope}`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save() {
    if (!name.trim()) {
      toast.error('Dale un nombre a la vista');
      return;
    }
    const r = await fetch('/api/saved-filters', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        scope,
        name: name.trim(),
        filters: currentFilters,
        pinned,
      }),
    });
    if (r.ok) {
      toast.success('Vista guardada');
      setSaveOpen(false);
      setName('');
      setPinned(false);
      void refresh();
    } else {
      const data = await r.json().catch(() => ({}));
      toast.error(data.detail || data.error || 'No se pudo guardar');
    }
  }

  async function togglePin(f: SavedFilter) {
    const r = await fetch(`/api/saved-filters/${f.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pinned: !f.pinned }),
    });
    if (r.ok) void refresh();
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar vista guardada?')) return;
    const r = await fetch(`/api/saved-filters/${id}`, { method: 'DELETE' });
    if (r.ok) {
      setItems((p) => p.filter((x) => x.id !== id));
      if (activeId === id) setActiveId(null);
    }
  }

  function apply(f: SavedFilter) {
    setActiveId(f.id);
    onApply(f.filters || {});
  }

  if (loading && items.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {items.length > 0 && (
        <div className="flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-ink-3">
          <Bookmark size={11} /> Vistas
        </div>
      )}
      {items.map((f) => (
        <div key={f.id} className="group inline-flex items-stretch overflow-hidden rounded-md border border-line bg-bg-elev">
          <button
            onClick={() => apply(f)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-[11.5px]',
              activeId === f.id ? 'bg-accent-soft text-accent' : 'hover:bg-bg-sunken',
            )}
          >
            {f.pinned && <Pin size={9} />}
            {f.name}
          </button>
          <div className="hidden border-l border-line bg-bg-sunken group-hover:flex">
            <button onClick={() => togglePin(f)} className="px-1.5 hover:text-accent" title={f.pinned ? 'Despinear' : 'Pinear'}>
              <Pin size={10} className={f.pinned ? 'text-accent' : ''} />
            </button>
            <button onClick={() => remove(f.id)} className="px-1.5 hover:text-danger" title="Eliminar">
              <Trash2 size={10} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => setSaveOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-line px-2 py-1 text-[11.5px] text-ink-3 hover:bg-bg-sunken hover:text-ink"
      >
        <Plus size={11} /> Guardar vista actual
      </button>

      {saveOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg-overlay backdrop-blur-sm">
          <div className="mt-[14vh] w-[min(96vw,420px)] rounded-xl border border-line bg-bg shadow-2">
            <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <h3 className="serif text-[14px] font-semibold">Guardar vista</h3>
              <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setSaveOpen(false)} aria-label="Cerrar">
                <X size={14} />
              </button>
            </header>
            <div className="grid gap-3 p-4">
              <input
                autoFocus
                placeholder="Nombre · ej: 'Tutelas pendientes'"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                onKeyDown={(ev) => ev.key === 'Enter' && void save()}
                className="input"
              />
              <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
                <input type="checkbox" checked={pinned} onChange={(ev) => setPinned(ev.target.checked)} />
                Pinear arriba
              </label>
            </div>
            <footer className="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5">
              <button className="btn btn-ghost btn-sm" onClick={() => setSaveOpen(false)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={save}>Guardar</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
