'use client';

import { AlertCircle, AlertTriangle, FileSearch, Info } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';

export type Inconsistency = {
  type: string;
  severity: 'high' | 'medium' | 'low';
  location: string;
  description: string;
  suggestion: string;
};

export type InconsistencyAnalysis = {
  id: string;
  matter_document_id?: string;
  inconsistencies: Inconsistency[];
  total_count: number;
  high_severity_count: number;
  summary: string;
  analyzed_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  fecha_contradictoria: 'Fecha contradictoria',
  nombre_no_coincide: 'Nombre no coincide',
  monto_incorrecto: 'Monto incorrecto',
  firma_faltante: 'Firma faltante',
  sello_faltante: 'Sello faltante',
  norma_inexistente: 'Norma inexistente',
  referencia_rota: 'Referencia rota',
  campo_faltante: 'Campo faltante',
  otro: 'Otro',
};

const SEVERITY = {
  high: { color: 'text-danger', icon: AlertCircle, label: 'Crítica' },
  medium: { color: 'text-warn', icon: AlertTriangle, label: 'Media' },
  low: { color: 'text-ink-3', icon: Info, label: 'Menor' },
} as const;

export function InconsistencyList({
  analysis,
  className,
}: {
  analysis: InconsistencyAnalysis;
  className?: string;
}) {
  const groups = ['high', 'medium', 'low'] as const;
  const byGroup = Object.fromEntries(
    groups.map((g) => [g, analysis.inconsistencies.filter((x) => x.severity === g)])
  ) as Record<typeof groups[number], Inconsistency[]>;

  return (
    <section className={cn('surface p-[var(--pad-card)]', className)}>
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-warn-soft text-warn">
          <FileSearch size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="serif m-0 text-[15px] font-semibold">Análisis de consistencia</h3>
          <p className="text-[11px] muted">
            {analysis.analyzed_at ? formatRelative(analysis.analyzed_at) : '—'}
            · {analysis.total_count} hallazgo(s)
            {analysis.high_severity_count > 0 && (
              <span className="text-danger"> · {analysis.high_severity_count} crítico(s)</span>
            )}
          </p>
        </div>
      </header>

      <p className="mt-2 text-[12.5px]">{analysis.summary}</p>

      {analysis.total_count === 0 ? (
        <div className="mt-3 rounded-md border border-ok bg-ok-soft p-3 text-[12.5px] text-ok">
          ✓ No se detectaron inconsistencias en este documento.
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {groups.map((g) => (byGroup[g].length > 0 ? (
            <div key={g}>
              <div className={cn('mb-1 text-[10.5px] font-semibold uppercase tracking-wider', SEVERITY[g].color)}>
                {SEVERITY[g].label} ({byGroup[g].length})
              </div>
              <ul className="flex flex-col gap-1.5">
                {byGroup[g].map((inc, i) => {
                  const S = SEVERITY[inc.severity];
                  return (
                    <li key={i} className="rounded-md border border-line bg-bg-elev p-2.5">
                      <div className="flex items-start gap-2">
                        <S.icon size={14} className={cn('mt-0.5 flex-none', S.color)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[12px] font-semibold">{TYPE_LABEL[inc.type] || inc.type}</span>
                            {inc.location && (
                              <span className="text-[10.5px] muted">· {inc.location}</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[12px] text-ink-2">{inc.description}</p>
                          {inc.suggestion && (
                            <div className="mt-1 rounded-md bg-accent-soft px-2 py-1 text-[11px] text-accent">
                              <span className="font-semibold">Sugerencia:</span> {inc.suggestion}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null))}
        </div>
      )}
    </section>
  );
}
