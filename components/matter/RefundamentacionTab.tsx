'use client';

import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * Placeholder · M09 Refundamentation Studio se construye en Sprint 6-7.
 * Por ahora, muestra el flujo y el valor para que socios/abogados conozcan
 * la feature que viene.
 */
export function RefundamentacionTab({
  matterId,
  instance,
}: {
  matterId: string;
  instance?: string | null;
}) {
  const showRoadmapPath = instance === 'apelacion' || instance === 'casacion';
  return (
    <section className="space-y-4">
      <div className="surface p-5">
        <div className="flex items-center gap-2">
          <span className="chip chip-purple">
            <Sparkles size={11} aria-hidden="true" /> M09 · Roadmap Sprint 6-7
          </span>
          <span className="ml-auto text-[11.5px] muted">case {matterId.slice(0, 8)}</span>
        </div>
        <h3 className="serif mt-3 text-[18px] font-semibold">Refundamentación entre instancias</h3>
        <p className="mt-2 text-[13px] text-ink-2 leading-relaxed">
          Tu trabajo principal como abogado <strong>no es redactar, es REFORMULAR</strong>. Cada
          instancia exige reorganizar el mismo argumento jurídico desde un nuevo ángulo,
          anticipándose a lo que dijeron los jueces previos.
        </p>
        <p className="mt-3 text-[13px] text-ink-2 leading-relaxed">
          El <strong>Refundamentation Studio</strong> hará lo siguiente automáticamente:
        </p>
        <ul className="mt-3 space-y-2 text-[12.5px] text-ink-2">
          <li className="flex gap-2"><ArrowRight size={12} className="mt-0.5 flex-none text-accent" aria-hidden="true" /> Lee la sentencia previa y extrae los fundamentos del juez.</li>
          <li className="flex gap-2"><ArrowRight size={12} className="mt-0.5 flex-none text-accent" aria-hidden="true" /> Identifica los puntos donde tu argumento original fue débil.</li>
          <li className="flex gap-2"><ArrowRight size={12} className="mt-0.5 flex-none text-accent" aria-hidden="true" /> Sugiere nuevos enfoques jurisprudenciales no usados en la instancia anterior.</li>
          <li className="flex gap-2"><ArrowRight size={12} className="mt-0.5 flex-none text-accent" aria-hidden="true" /> Genera el escrito refundamentado con énfasis en los puntos débiles del fallo previo.</li>
        </ul>
      </div>

      {showRoadmapPath ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-[12.5px]">
          <strong>Tu caso está en {instance === 'apelacion' ? 'apelación' : 'casación'}.</strong>{' '}
          Cuando M09 esté disponible, este caso será uno de los primeros candidatos para el
          flujo automatizado de refundamentación.
        </div>
      ) : (
        <div className="rounded-md border border-line bg-bg-sunken p-3 text-[11.5px] muted">
          Esta feature aplica cuando un caso pasa a apelación o casación. Configura la
          <strong> instancia procesal</strong> del caso desde el resumen para activar el flujo
          cuando esté disponible.
        </div>
      )}
    </section>
  );
}
