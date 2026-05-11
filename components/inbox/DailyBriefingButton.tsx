'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

type Briefing = {
  fecha: string;
  plazos_proximos: Array<{
    titulo: string;
    fecha: string | null;
    matter_titulo: string | null;
    dias_restantes: number | null;
  }>;
  plazos_criticos_count: number;
  judicial_unread: Array<{ titulo: string; severidad: string }>;
  emails_unread: Array<{ subject: string; severidad: string }>;
  alertas_normativas: Array<{ title: string }>;
  narrative: string;
};

export function DailyBriefingButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Briefing | null>(null);

  async function load() {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch('/api/sla/briefing', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as Briefing;
      setData(json);
    } catch (e) {
      toast.error('No se pudo generar el briefing');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function speak() {
    if (!data?.narrative) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.message('TTS no disponible en este navegador');
      return;
    }
    const u = new SpeechSynthesisUtterance(data.narrative);
    u.lang = 'es-CO';
    u.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  return (
    <>
      <button className="btn btn-primary" onClick={load} title="Genera tu briefing diario">
        <Sparkles size={14} aria-hidden="true" />
        Mi briefing del día
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[640px] max-w-[92vw] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 surface overflow-auto p-5">
            <Dialog.Title className="serif flex items-center gap-2 text-[18px] font-semibold">
              <Calendar size={18} className="text-accent" aria-hidden="true" />
              Briefing del día
            </Dialog.Title>
            {loading ? (
              <div className="mt-6 flex items-center gap-2 text-[12.5px] muted">
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Generando…
              </div>
            ) : data ? (
              <div className="mt-4 grid gap-4">
                <div className="rounded-md border border-line bg-bg-elev p-4">
                  <div className="text-[11px] uppercase tracking-wider muted">Resumen ejecutivo</div>
                  <p className="mt-2 text-[13.5px] leading-relaxed">{data.narrative}</p>
                  <div className="mt-3 flex justify-end">
                    <button className="btn" onClick={speak}>
                      <Volume2 size={12} aria-hidden="true" /> Reproducir
                    </button>
                  </div>
                </div>
                <Section title="Plazos próximos" empty="Sin plazos en los próximos 7 días.">
                  {data.plazos_proximos.map((p, i) => (
                    <li key={i} className="flex items-center justify-between text-[12.5px]">
                      <span>{p.titulo} {p.matter_titulo && <span className="muted">· {p.matter_titulo}</span>}</span>
                      <span className="muted">
                        {p.fecha} {p.dias_restantes !== null ? `(${p.dias_restantes}d)` : ''}
                      </span>
                    </li>
                  ))}
                </Section>
                <Section title="Notificaciones judiciales" empty="No hay notificaciones sin leer.">
                  {data.judicial_unread.map((n, i) => (
                    <li key={i} className="flex items-center gap-2 text-[12.5px]">
                      <span
                        className={`chip ${
                          n.severidad === 'critica' ? 'chip-red' : n.severidad === 'alta' ? 'chip-amber' : 'chip-blue'
                        }`}
                      >
                        {n.severidad}
                      </span>
                      <span className="truncate">{n.titulo}</span>
                    </li>
                  ))}
                </Section>
                <Section title="Correos legales" empty="Sin correos legales nuevos.">
                  {data.emails_unread.map((e, i) => (
                    <li key={i} className="text-[12.5px]">{e.subject}</li>
                  ))}
                </Section>
                <Section title="Alertas normativas" empty="Sin cambios normativos relevantes.">
                  {data.alertas_normativas.map((a, i) => (
                    <li key={i} className="text-[12.5px]">{a.title}</li>
                  ))}
                </Section>
              </div>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button className="btn" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const isEmpty = arr.length === 0;
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-wider muted">{title}</div>
      {isEmpty ? (
        <div className="text-[12px] muted">{empty}</div>
      ) : (
        <ul className="grid gap-1.5">{children}</ul>
      )}
    </div>
  );
}
