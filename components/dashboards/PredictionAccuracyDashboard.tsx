'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KpiCard } from '@/components/charts/primitives';

type Accuracy = {
  total_predictions_with_outcome?: number;
  correct?: number;
  accuracy_pct?: number;
  avg_confidence_when_correct?: number;
  avg_confidence_when_wrong?: number;
  sample_size?: number;
  error?: string;
};

export function PredictionAccuracyDashboard() {
  const [data, setData] = useState<Accuracy | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(180);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/analytics-v2/prediction-accuracy?days=${days}`, { cache: 'no-store' });
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (loading) {
    return <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-ink-3" size={24} /></div>;
  }

  const sample = data?.sample_size || 0;

  if (sample === 0) {
    return (
      <div className="surface p-8 text-center">
        <Sparkles className="mx-auto text-ink-3" size={28} />
        <h3 className="mt-2 serif text-[15px] font-semibold">Aún no hay datos</h3>
        <p className="mx-auto mt-1 max-w-md text-[12.5px] muted">
          Para medir accuracy necesitamos casos que (a) tengan una predicción IA generada
          (Sprint 17) y (b) hayan sido cerrados con una lesson aprendida (Sprint 15) en
          los últimos {days} días. Cuando empieces a cerrar casos, este dashboard se llena solo.
        </p>
      </div>
    );
  }

  const acc = data?.accuracy_pct || 0;
  const accTone = acc >= 70 ? 'ok' : acc >= 50 ? 'warn' : 'danger';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Accuracy"
          value={`${acc}%`}
          sub={`${data?.correct || 0} de ${sample}`}
          tone={accTone}
        />
        <KpiCard
          label="Muestra"
          value={sample}
          sub={`casos cerrados con predicción previa`}
        />
        <KpiCard
          label="Confianza · aciertos"
          value={`${Math.round((data?.avg_confidence_when_correct || 0) * 100)}%`}
          sub="promedio cuando acertó"
          tone="ok"
        />
        <KpiCard
          label="Confianza · errores"
          value={`${Math.round((data?.avg_confidence_when_wrong || 0) * 100)}%`}
          sub="promedio cuando falló"
          tone="warn"
        />
      </div>

      <section className="surface p-[var(--pad-card)]">
        <header className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="serif m-0 flex items-center gap-1.5 text-[14.5px] font-semibold">
              <TrendingUp size={14} className="text-accent" /> Calibración de las predicciones
            </h3>
            <p className="text-[11.5px] muted">
              Compara confianza promedio en aciertos vs errores · si están cerca,
              el modelo está mal calibrado y subestima incertidumbre.
            </p>
          </div>
          <select className="input w-auto text-[11px]"
            value={days} onChange={(ev) => setDays(parseInt(ev.target.value))}>
            <option value="90">90 días</option>
            <option value="180">180 días</option>
            <option value="365">365 días</option>
            <option value="730">2 años</option>
          </select>
        </header>
        <div className="grid gap-2 text-[12.5px]">
          <p>
            En los últimos <span className="font-semibold">{days} días</span>, las
            predicciones IA <span className="font-semibold">acertaron en {acc}%</span> de
            los casos cerrados con outcome definido.
          </p>
          {(data?.avg_confidence_when_correct || 0) > (data?.avg_confidence_when_wrong || 0) + 0.1 ? (
            <p className="rounded-md border-l-2 border-ok bg-ok-soft p-2 text-[12px]">
              ✓ Buena calibración: el modelo está más seguro cuando acierta que cuando falla.
            </p>
          ) : (
            <p className="rounded-md border-l-2 border-warn bg-warn-soft p-2 text-[12px]">
              ⚠ Calibración débil: el modelo muestra confianza similar en aciertos y errores.
              Considera marcar como "revisada" más predicciones para alimentar mejoras futuras.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
