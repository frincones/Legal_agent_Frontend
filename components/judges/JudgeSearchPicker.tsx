'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Scale, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type JudgeLite = {
  id: string;
  full_name: string;
  corte: string;
  sala: string | null;
  cargo: string | null;
  especialidades: string[];
  decisions_total: number;
};

const CORTE_LABEL: Record<string, string> = {
  CORTE_CONSTITUCIONAL: 'Corte Constitucional',
  CORTE_SUPREMA: 'Corte Suprema',
  CONSEJO_ESTADO: 'Consejo de Estado',
  TRIBUNAL_SUPERIOR: 'Tribunal Superior',
  JUZGADO_CIRCUITO: 'Juzgado de Circuito',
  JUZGADO_MUNICIPAL: 'Juzgado Municipal',
  OTRO: 'Otros',
};

/**
 * Sprint 20 · Search/picker de jueces.
 *
 * Modo "inline" (mostrar dropdown bajo el input al teclear) o
 * "embedded" (mostrar lista siempre).
 */
export function JudgeSearchPicker({
  selectedId,
  onSelect,
  mode = 'inline',
  placeholder = 'Buscar juez o magistrado…',
  className,
}: {
  selectedId?: string | null;
  onSelect: (j: JudgeLite | null) => void;
  mode?: 'inline' | 'embedded';
  placeholder?: string;
  className?: string;
}) {
  const [q, setQ] = useState('');
  const [corte, setCorte] = useState('');
  const [cortes, setCortes] = useState<Array<{ code: string; label: string; count: number }>>([]);
  const [items, setItems] = useState<JudgeLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(mode === 'embedded');

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/judges/cortes', { cache: 'no-store' });
        if (r.ok) setCortes((await r.json()).items || []);
      } catch { /* ignore */ }
    })();
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (q.trim()) params.set('q', q.trim());
      if (corte) params.set('corte', corte);
      const r = await fetch(`/api/judges?${params.toString()}`, { cache: 'no-store' });
      if (r.ok) setItems((await r.json()).items || []);
    } finally {
      setLoading(false);
    }
  }, [q, corte]);

  useEffect(() => {
    const t = setTimeout(() => { void search(); }, 200);
    return () => clearTimeout(t);
  }, [search]);

  const selected = useMemo(() => items.find((j) => j.id === selectedId), [items, selectedId]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Selected chip · sólo en modo inline */}
      {mode === 'inline' && selected && (
        <div className="flex items-center gap-2 rounded-md border border-accent bg-accent-soft px-2 py-1.5">
          <Scale size={12} className="text-accent" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold">{selected.full_name}</div>
            <div className="text-[10.5px] muted">
              {CORTE_LABEL[selected.corte] || selected.corte}
              {selected.sala && ` · ${selected.sala}`}
            </div>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="btn btn-icon btn-ghost btn-sm"
            aria-label="Limpiar selección"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            placeholder={placeholder}
            value={q}
            onChange={(ev) => setQ(ev.target.value)}
            onFocus={() => mode === 'inline' && setOpen(true)}
            className="input w-full pl-7 text-[12.5px]"
          />
        </div>
        <select
          className="input w-auto text-[11.5px]"
          value={corte}
          onChange={(ev) => setCorte(ev.target.value)}
        >
          <option value="">Todas las cortes</option>
          {cortes.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} ({c.count})
            </option>
          ))}
        </select>
      </div>

      {(open || mode === 'embedded') && (
        <div
          className={cn(
            mode === 'inline'
              ? 'max-h-[260px] overflow-y-auto rounded-md border border-line bg-bg-elev'
              : 'rounded-md border border-line bg-bg-elev',
          )}
        >
          {loading ? (
            <div className="p-4 text-center text-[12px] muted">
              <Loader2 className="mx-auto animate-spin" size={16} />
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-[12px] muted">
              {q ? `Sin resultados para "${q}"` : 'Escribe para buscar'}
            </div>
          ) : (
            <ul>
              {items.map((j) => (
                <li key={j.id}>
                  <button
                    onClick={() => {
                      onSelect(j);
                      if (mode === 'inline') {
                        setOpen(false);
                        setQ('');
                      }
                    }}
                    className={cn(
                      'flex w-full items-start gap-2 px-2.5 py-1.5 text-left',
                      'hover:bg-bg-sunken',
                      selectedId === j.id && 'bg-accent-soft',
                    )}
                  >
                    <Scale size={12} className="mt-0.5 flex-none text-ink-3" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-medium">{j.full_name}</div>
                      <div className="text-[10.5px] muted">
                        {CORTE_LABEL[j.corte] || j.corte}
                        {j.sala && ` · ${j.sala}`}
                        {j.cargo && ` · ${j.cargo}`}
                      </div>
                      {j.especialidades.length > 0 && (
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {j.especialidades.slice(0, 3).map((e) => (
                            <span key={e} className="rounded-md bg-bg-sunken px-1.5 py-0.5 text-[10px] text-ink-3">
                              {e}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {j.decisions_total > 0 && (
                      <span className="text-[10px] muted">{j.decisions_total} sent.</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
