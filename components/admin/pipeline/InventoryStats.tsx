'use client';

/**
 * components/admin/pipeline/InventoryStats.tsx
 *
 * Vista detallada del inventario:
 *  - Totales (docs, chunks, plantillas, sentencias, normas)
 *  - Storage gauges (Postgres + R2 con barra progreso)
 *  - Tabla por (source, doc_type, materia)
 *  - Costo acumulado
 */

import type { InventorySummary } from '@/lib/admin/pipeline/types';

interface InventoryStatsProps {
  inventory: InventorySummary;
}

function formatNumber(n: number): string {
  return n.toLocaleString('es-CO');
}

function StorageGauge({ label, used, total, unit }: { label: string; used: number; total: number; unit: string }) {
  const pct = (used / total) * 100;
  const tone = pct >= 90 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-[var(--v2-text-secondary,#4A4944)]">{label}</span>
        <span className="text-[11px] tabular-nums text-[var(--v2-text-tertiary,#807E76)]">
          {used.toFixed(used < 10 ? 2 : 0)} / {total} {unit}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--v2-bg-subtle,#F2F1EC)]">
        <div className={`h-full transition-all duration-500 ${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <div className="mt-1.5 flex items-baseline justify-between text-[10px]">
        <span className="tabular-nums text-[var(--v2-text-tertiary,#807E76)]">{pct.toFixed(1)}% usado</span>
        <span className="font-medium tabular-nums" style={{ color: pct >= 80 ? '#B45309' : 'var(--v2-text-primary, #1A1916)' }}>
          {(total - used).toFixed(used < 10 ? 2 : 0)} {unit} libres
        </span>
      </div>
    </div>
  );
}

export function InventoryStats({ inventory }: InventoryStatsProps) {
  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="mb-3 text-[14px] font-semibold" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
          Totales del corpus
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
              Documentos
            </div>
            <div className="mt-1 text-[20px] font-medium tabular-nums" style={{ fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)' }}>
              {formatNumber(inventory.total_documents)}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
              Chunks (RAG)
            </div>
            <div className="mt-1 text-[20px] font-medium tabular-nums" style={{ fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)' }}>
              {formatNumber(inventory.total_chunks)}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
              Plantillas
            </div>
            <div className="mt-1 text-[20px] font-medium tabular-nums" style={{ fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)' }}>
              {formatNumber(inventory.total_templates)}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
              Sentencias
            </div>
            <div className="mt-1 text-[20px] font-medium tabular-nums" style={{ fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)' }}>
              {formatNumber(inventory.total_sentencias)}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
              Normas
            </div>
            <div className="mt-1 text-[20px] font-medium tabular-nums" style={{ fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)' }}>
              {formatNumber(inventory.total_normas)}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[14px] font-semibold" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
          Storage usado
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StorageGauge
            label="Postgres (Supabase Free)"
            used={inventory.postgres_size_mb}
            total={inventory.postgres_limit_mb}
            unit="MB"
          />
          <StorageGauge
            label="Cloudflare R2 (Free tier)"
            used={inventory.r2_size_gb}
            total={inventory.r2_limit_gb}
            unit="GB"
          />
          <div className="rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white p-4">
            <div className="text-[12px] font-medium text-[var(--v2-text-secondary,#4A4944)]">
              Costo embeddings acumulado
            </div>
            <div
              className="mt-2 text-[24px] font-medium tabular-nums"
              style={{ fontFamily: 'var(--v2-font-serif, var(--font-new-spirit), Georgia, serif)' }}
            >
              ${inventory.embeddings_cost_usd.toFixed(2)} USD
            </div>
            <div className="mt-1 text-[11px] text-[var(--v2-text-tertiary,#807E76)]">
              text-embedding-3-small @ $0.02/1M tokens
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[14px] font-semibold" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
          Desglose por fuente y tipo
        </h3>
        <div className="overflow-x-auto rounded-lg border border-[var(--v2-border-default,#D4D2CA)] bg-white">
          <table className="w-full text-[12px]">
            <thead className="bg-[var(--v2-bg-subtle,#F2F1EC)]">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Fuente</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Tipo</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--v2-text-secondary,#4A4944)]">Materia</th>
                <th className="px-3 py-2 text-right font-medium text-[var(--v2-text-secondary,#4A4944)]">Docs</th>
                <th className="px-3 py-2 text-right font-medium text-[var(--v2-text-secondary,#4A4944)]">Último ingest</th>
              </tr>
            </thead>
            <tbody>
              {inventory.by_source.map((item, i) => (
                <tr key={`${item.source}-${item.doc_type}-${i}`} className="border-t border-[var(--v2-border-subtle,#E8E7E1)]">
                  <td className="px-3 py-2 font-mono text-[11px]">{item.source}</td>
                  <td className="px-3 py-2">{item.doc_type}</td>
                  <td className="px-3 py-2 text-[var(--v2-text-tertiary,#807E76)]">{item.materia ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{formatNumber(item.count)}</td>
                  <td className="px-3 py-2 text-right text-[var(--v2-text-tertiary,#807E76)]">
                    {item.last_ingested_at ? new Date(item.last_ingested_at).toLocaleString('es-CO') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
