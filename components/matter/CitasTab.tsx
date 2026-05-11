'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CitationBadge, mapBackendStatus } from '@/components/legal/CitationBadge';
import { formatRelative } from '@/lib/utils';

type MatterCitation = {
  id: string;
  matter_document_id: string;
  document_titulo: string | null;
  citation_ref: string;
  rubro_inserted: string | null;
  estado: string | null;
  match_score: number | null;
  inserted_at: string | null;
  verified_at: string | null;
};

export function CitasTab({ matterId }: { matterId: string }) {
  const [items, setItems] = useState<MatterCitation[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matters/${encodeURIComponent(matterId)}/citations`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as { items: MatterCitation[] };
      setItems(data.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [matterId]);

  const totals = items
    ? items.reduce(
        (acc, it) => {
          const s = mapBackendStatus(it.estado);
          acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      )
    : {};

  return (
    <section className="space-y-4">
      <div className="surface flex items-center gap-3 p-[var(--pad-card)]">
        <h3 className="serif text-[16px] font-semibold">Citas del expediente</h3>
        <span className="text-[12px] muted">
          {loading ? 'cargando…' : `${items?.length ?? 0} citas detectadas`}
        </span>
        {items && items.length > 0 && (
          <span className="ml-2 flex items-center gap-1.5">
            {(['verified','pending','outdated','unverifiable'] as const).map((s) =>
              totals[s] ? (
                <span key={s} className="inline-flex items-center gap-1">
                  <CitationBadge status={s} showLabel={false} size="xs" />
                  <span className="text-[11px] muted">{totals[s]}</span>
                </span>
              ) : null,
            )}
          </span>
        )}
        <button
          type="button"
          className="btn btn-sm ml-auto"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          Recargar
        </button>
      </div>

      {loading && !items ? (
        <div className="surface flex items-center gap-2 p-6 muted">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Cargando citas…
        </div>
      ) : !items || items.length === 0 ? (
        <div className="surface p-6 text-center muted">
          Sin citas registradas en los documentos del caso. Las citas aparecen automáticamente
          cuando el sidebar del Live Canvas las verifica.
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-bg-sunken text-[11px] uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-3 py-2 text-left">Cita</th>
                <th className="px-3 py-2 text-left">Documento</th>
                <th className="px-3 py-2 text-left">Rubro</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Detectada</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-line align-top">
                  <td className="px-3 py-2">
                    <span className="mono text-[12px] font-semibold">{c.citation_ref}</span>
                  </td>
                  <td className="px-3 py-2 muted">{c.document_titulo ?? '—'}</td>
                  <td className="px-3 py-2 max-w-[420px]">
                    <div className="line-clamp-2 text-[12px] text-ink-2">
                      {c.rubro_inserted ?? '—'}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <CitationBadge status={mapBackendStatus(c.estado)} />
                  </td>
                  <td className="px-3 py-2 text-[11.5px] muted">
                    {c.inserted_at ? formatRelative(c.inserted_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-md border border-line bg-bg-sunken p-3 text-[11.5px] muted">
        <ExternalLink size={11} className="mr-1 inline align-text-top" aria-hidden="true" />
        Las citas se persisten en <code className="mono">document_citations</code> cuando el agente
        las verifica desde el sidebar del Live Canvas. Para nuevas citas, abre el Live Canvas y
        deja que LexAI las detecte y verifique.
      </div>
    </section>
  );
}
