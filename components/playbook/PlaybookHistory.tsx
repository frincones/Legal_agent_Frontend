'use client';

/**
 * Sprint M20.12 · PlaybookHistory
 *
 * Lista compacta de versiones archivadas del playbook con botón restore.
 */
import { useEffect, useState } from 'react';
import { History, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type HistoryEntry = {
  id: string;
  version: number;
  jurisdiction_default: string;
  redline_style: string;
  tone: string;
  forbidden_terms: string[];
  required_clauses: string[];
  raw_md_preview: string;
  raw_md_length: number;
  updated_by: string | null;
  archived_at: string;
};

export function PlaybookHistory({ onRestored }: { onRestored?: () => void }) {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringV, setRestoringV] = useState<number | null>(null);

  async function refresh() {
    try {
      const r = await fetch('/api/firm/playbook/history?limit=20', { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        setItems(data.history || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function restore(version: number) {
    if (!confirm(`Restaurar playbook a versión ${version}? La versión actual quedará archivada.`)) return;
    setRestoringV(version);
    try {
      const r = await fetch(`/api/firm/playbook/restore/${version}`, { method: 'POST' });
      if (r.ok) {
        toast.success(`Restaurado a versión ${version}`);
        onRestored?.();
        await refresh();
      } else {
        toast.error('Restore falló');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error');
    } finally {
      setRestoringV(null);
    }
  }

  if (loading) {
    return (
      <div className="surface p-4 flex items-center gap-2 text-[12.5px] muted">
        <Loader2 size={14} className="animate-spin" /> Cargando historial…
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="surface p-4 text-[12.5px] muted">
        No hay versiones archivadas todavía. La primera modificación a tu playbook
        creará la primera entrada en el historial.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <header className="flex items-center gap-2 text-[12.5px] muted">
        <History size={12} /> {items.length} versión(es) archivada(s)
      </header>
      <ul className="grid gap-1">
        {items.map((it) => (
          <li
            key={it.id}
            className="surface p-3 flex items-start justify-between gap-3 hover:bg-bg-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[12.5px]">
                <strong>v{it.version}</strong>
                <span className="muted">·</span>
                <span className="muted">{new Date(it.archived_at).toLocaleString('es-CO')}</span>
                <span className="muted">·</span>
                <span className="muted">{it.tone} · {it.redline_style}</span>
              </div>
              {it.raw_md_preview && (
                <p className="mt-1 text-[12px] muted line-clamp-2">{it.raw_md_preview}</p>
              )}
              <div className="mt-1 text-[11.5px] muted">
                {it.forbidden_terms.length} término(s) prohibido(s) ·{' '}
                {it.required_clauses.length} cláusula(s) requerida(s) ·{' '}
                {it.raw_md_length} chars markdown
              </div>
            </div>
            <button
              type="button"
              onClick={() => restore(it.version)}
              disabled={restoringV !== null}
              className="btn shrink-0 text-[12px]"
              title={`Restaurar versión ${it.version}`}
            >
              {restoringV === it.version
                ? <Loader2 size={12} className="animate-spin" />
                : <RotateCcw size={12} />}
              Restaurar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
