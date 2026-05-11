import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_RAILWAY_API ?? 'http://localhost:8000';

type MatterRow = {
  id: string;
  titulo: string;
  materia: string | null;
  status: string;
  etapa_procesal: string | null;
  juzgado: string | null;
  expediente: string | null;
  proxima_fecha: string | null;
  proxima_tipo: string | null;
};

async function fetchMatters(token: string): Promise<MatterRow[]> {
  try {
    const r = await fetch(`${API_BASE}/v1/portal/${encodeURIComponent(token)}/matters`, { cache: 'no-store' });
    if (!r.ok) return [];
    return (await r.json()).items || [];
  } catch {
    return [];
  }
}

export default async function PortalCasos({ params }: { params: { token: string } }) {
  const items = await fetchMatters(params.token);
  if (!items) notFound();

  return (
    <div className="grid gap-3">
      <header>
        <Link href={`/portal/${params.token}`} className="text-[12.5px] muted hover:underline">← Volver</Link>
        <h1 className="serif mt-1 text-[22px] font-semibold">Tus casos ({items.length})</h1>
      </header>
      {items.length === 0 ? (
        <div className="surface p-4 text-[12.5px] muted">No tienes casos asociados aún.</div>
      ) : (
        items.map((m) => (
          <Link key={m.id} href={`/portal/${params.token}/casos/${m.id}`} className="surface flex items-center gap-3 p-3 transition-colors hover:border-accent">
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold truncate">{m.titulo}</div>
              <div className="text-[11.5px] muted">
                {m.expediente && <span className="mono mr-2">{m.expediente}</span>}
                {m.materia} · {m.status} {m.etapa_procesal && `· ${m.etapa_procesal}`}
              </div>
              {m.proxima_fecha && (
                <div className="mt-0.5 text-[11px] text-accent">
                  Próximo: {m.proxima_tipo || 'evento'} · {new Date(m.proxima_fecha).toLocaleDateString('es-CO')}
                </div>
              )}
            </div>
            <ChevronRight size={16} className="text-ink-3 flex-none" aria-hidden="true" />
          </Link>
        ))
      )}
    </div>
  );
}
