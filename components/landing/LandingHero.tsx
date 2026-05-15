import Link from 'next/link';

export function LandingHero({ stats }: { stats: any }) {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-20 text-center">
      <span className="chip chip-purple">Disponible en Colombia · Honduras · Guatemala · México</span>
      <h1 className="serif mt-6 text-4xl font-semibold tracking-tight md:text-6xl leading-[1.05]">
        El asistente legal con IA{' '}
        <span className="text-accent">verificada</span>{' '}
        para abogados de habla hispana
      </h1>
      <p className="mx-auto mt-6 max-w-3xl text-[15px] md:text-[16px] text-ink-2 leading-relaxed">
        Dicta lo que necesitas y LexAI ejecuta investigación jurisprudencial, redacta el escrito y
        verifica cada cita contra los portales oficiales. Court Watcher monitorea tus expedientes
        para que <strong>no vuelvas a visitar el juzgado cada semana</strong>.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/signup" className="btn btn-primary btn-lg">
          Empezar gratis · 14 días
        </Link>
        <Link href="/pricing" className="btn btn-lg">
          Ver planes
        </Link>
      </div>
      <p className="mt-5 text-[11.5px] muted">
        Sin tarjeta de crédito · Verificación de tarjeta profesional · Habeas Data Ley 1581/2012
      </p>

      {/* Live stats */}
      {stats && (
        <div className="mt-14 grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
          <Stat label="Firmas activas" value={stats.firms_active || 0} />
          <Stat label="Casos gestionados" value={stats.matters_total || 0} />
          <Stat label="Documentos procesados" value={stats.documents_total || 0} />
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface p-4 text-center">
      <div className="serif text-3xl font-semibold tabular text-ink">
        {value.toLocaleString('es-CO')}
      </div>
      <div className="mt-1 text-[11px] muted">{label}</div>
    </div>
  );
}
