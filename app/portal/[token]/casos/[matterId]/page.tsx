import Link from 'next/link';
import { notFound } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

async function fetchDetail(token: string, matterId: string) {
  try {
    const r = await fetch(`${API_BASE}/v1/portal/${encodeURIComponent(token)}/matters/${matterId}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export default async function PortalCasoDetalle({ params }: { params: { token: string; matterId: string } }) {
  const data = await fetchDetail(params.token, params.matterId);
  if (!data) notFound();
  const m = data.matter;
  return (
    <div className="grid gap-4">
      <Link href={`/portal/${params.token}/casos`} className="text-[12.5px] muted hover:underline">← Volver a mis casos</Link>

      <section className="surface p-5">
        <h1 className="serif text-[22px] font-semibold">{m.titulo}</h1>
        <div className="mt-1 text-[12.5px] muted">
          {m.expediente && <span className="mono mr-2">{m.expediente}</span>}
          {m.materia} · {m.status} {m.etapa_procesal && `· ${m.etapa_procesal}`}
        </div>
        {m.juzgado && <div className="mt-1 text-[12.5px] muted">{m.juzgado}</div>}
        {m.proxima_fecha && (
          <div className="mt-3 rounded-md border border-accent/30 bg-accent/5 p-3 text-[12.5px]">
            <strong>Próxima actuación:</strong> {m.proxima_tipo || 'evento'} · {new Date(m.proxima_fecha).toLocaleDateString('es-CO')}
          </div>
        )}
      </section>

      <section className="surface p-4">
        <h2 className="serif mb-2 text-[15px] font-semibold">Cronología</h2>
        {data.timeline.length === 0 ? (
          <div className="text-[12.5px] muted">Sin eventos registrados.</div>
        ) : (
          <ul className="grid gap-2">
            {data.timeline.map((t: any, i: number) => (
              <li key={i} className="border-b border-line/40 pb-2 last:border-0">
                <div className="text-[12.5px] font-semibold">{t.titulo}</div>
                <div className="text-[11.5px] muted">
                  {t.fecha && new Date(t.fecha).toLocaleDateString('es-CO')} {t.tipo && `· ${t.tipo}`}
                </div>
                {t.descripcion && <div className="mt-1 text-[12px]">{t.descripcion}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface p-4">
        <h2 className="serif mb-2 text-[15px] font-semibold">Plazos</h2>
        {data.deadlines.length === 0 ? (
          <div className="text-[12.5px] muted">Sin plazos registrados.</div>
        ) : (
          <ul className="grid gap-1.5">
            {data.deadlines.map((d: any, i: number) => (
              <li key={i} className="flex items-center justify-between border-b border-line/40 pb-1.5 last:border-0 text-[12.5px]">
                <span className={d.completado ? 'line-through muted' : ''}>{d.titulo} {d.tipo && <span className="muted">({d.tipo})</span>}</span>
                <span className="muted">{d.fecha && new Date(d.fecha).toLocaleDateString('es-CO')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
