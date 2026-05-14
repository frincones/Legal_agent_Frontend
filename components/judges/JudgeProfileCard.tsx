'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, Scale } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

type Judge = {
  id: string;
  full_name: string;
  corte: string;
  sala: string | null;
  cargo: string | null;
  ciudad: string | null;
  especialidades: string[];
  perfil: string | null;
  decisions_total: number;
};

type Decision = {
  id: string | null;
  numero: string | null;
  corte: string;
  sala: string | null;
  tipo_sentencia: string | null;
  fecha: string | null;
  temas: string[];
  ratio_decidendi: string | null;
  fuente_url: string | null;
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

export function JudgeProfileCard({ judgeId, className }: { judgeId: string; className?: string }) {
  const [judge, setJudge] = useState<Judge | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [jR, dR, sR] = await Promise.all([
        fetch(`/api/judges/${judgeId}`, { cache: 'no-store' }),
        fetch(`/api/judges/${judgeId}/decisions?limit=8`, { cache: 'no-store' }),
        fetch(`/api/judges/${judgeId}/stats`, { cache: 'no-store' }),
      ]);
      if (jR.ok) setJudge(await jR.json());
      if (dR.ok) setDecisions((await dR.json()).items || []);
      if (sR.ok) setStats(await sR.json());
    } finally {
      setLoading(false);
    }
  }, [judgeId]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className={cn('surface p-6 text-center', className)}>
        <Loader2 className="mx-auto animate-spin text-ink-3" size={20} />
      </div>
    );
  }
  if (!judge) {
    return (
      <div className={cn('surface p-6 text-center text-[12.5px] muted', className)}>
        Juez no encontrado.
      </div>
    );
  }

  const decisionsCount = (stats?.decisions_in_db as number) ?? decisions.length;

  return (
    <section className={cn('surface p-[var(--pad-card)]', className)}>
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-accent-soft text-accent">
          <Scale size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="serif m-0 text-[16px] font-semibold">{judge.full_name}</h3>
          <p className="text-[11.5px] muted">
            {CORTE_LABEL[judge.corte] || judge.corte}
            {judge.sala && ` · ${judge.sala}`}
            {judge.cargo && ` · ${judge.cargo}`}
            {judge.ciudad && ` · ${judge.ciudad}`}
          </p>
          {judge.especialidades.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {judge.especialidades.map((e) => (
                <span key={e} className="chip chip-neutral text-[10px]">{e}</span>
              ))}
            </div>
          )}
        </div>
      </header>

      {judge.perfil && (
        <div className="mt-3 rounded-md bg-bg-sunken p-3 text-[12.5px] leading-relaxed">
          {judge.perfil}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-bg-elev p-2">
          <div className="serif tabular text-[18px] font-semibold">{decisionsCount}</div>
          <div className="text-[10px] muted">Sentencias indexadas</div>
        </div>
        <div className="rounded-md bg-bg-elev p-2">
          <div className="serif tabular text-[18px] font-semibold">
            {Math.round(((stats?.decisions_won_pct as number) ?? 0))}%
          </div>
          <div className="text-[10px] muted">Tendencia favorable*</div>
        </div>
        <div className="rounded-md bg-bg-elev p-2">
          <div className="serif tabular text-[18px] font-semibold">
            {(stats?.predictions_run as number) ?? 0}
          </div>
          <div className="text-[10px] muted">Simulaciones</div>
        </div>
      </div>

      {decisions.length > 0 && (
        <div className="mt-4">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
            Decisiones recientes
          </div>
          <ul className="flex flex-col gap-1">
            {decisions.slice(0, 6).map((d, i) => (
              <li key={d.id || i} className="flex items-start gap-2 rounded-md border border-line bg-bg-elev px-2 py-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="mono text-[11px] text-accent">{d.numero || '—'}</span>
                    {d.fecha && <span className="text-[10.5px] muted">{formatDate(d.fecha)}</span>}
                  </div>
                  {d.ratio_decidendi && (
                    <p className="line-clamp-2 text-[11.5px] text-ink-2">{d.ratio_decidendi}</p>
                  )}
                </div>
                {d.fuente_url && (
                  <a
                    href={d.fuente_url}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-icon btn-ghost btn-sm"
                    title="Ver fuente oficial"
                  >
                    <ExternalLink size={11} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[10px] muted">
        * Tendencia estimada con base en decisiones indexadas. No predice
        outcomes ni reemplaza criterio profesional.
      </p>
    </section>
  );
}
