'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, PartyPopper, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

const DISMISS_KEY = 'lexai.welcome_banner.dismissed';

export function WelcomeBanner() {
  const search = useSearchParams();
  const [show, setShow] = useState(false);
  const [removingDemo, setRemovingDemo] = useState(false);

  useEffect(() => {
    // Mostrar si: viene ?welcome=1, o si nunca lo cerró Y tiene demo data
    const fromParam = search?.get('welcome') === '1';
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === 'true'; } catch {}

    if (fromParam) {
      setShow(true);
      try { localStorage.removeItem(DISMISS_KEY); } catch {}
      return;
    }

    if (dismissed) return;

    fetch('/api/me/onboarding', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.has_demo_data && !d?.all_completed) setShow(true);
      })
      .catch(() => {});
  }, [search]);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch {}
    setShow(false);
  }

  async function removeDemoData() {
    if (!confirm('¿Borrar los 2 clientes y 2 casos de ejemplo?')) return;
    setRemovingDemo(true);
    try {
      const r = await fetch('/api/me/onboarding/demo-data', { method: 'DELETE' });
      if (r.ok) {
        toast.success('Datos demo eliminados · tu workspace está limpio');
        dismiss();
        setTimeout(() => window.location.reload(), 800);
      } else toast.error('No se pudo eliminar');
    } finally { setRemovingDemo(false); }
  }

  if (!show) return null;

  return (
    <div className="relative mx-auto mb-4 max-w-4xl">
      <div className="surface border-accent/50 bg-gradient-to-br from-accent-soft/40 to-purple-soft/40 p-5">
        <button
          className="absolute right-3 top-3 rounded p-1 hover:bg-bg-sunken"
          onClick={dismiss}
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
            <PartyPopper size={20} />
          </span>
          <div className="flex-1">
            <h2 className="serif text-[20px] font-semibold leading-tight">
              ¡Bienvenido a LexAI!
            </h2>
            <p className="mt-1 text-[12.5px] text-ink-2 leading-relaxed">
              Tu workspace está listo. Te sembramos <strong>2 clientes y 2 casos de ejemplo</strong> para
              que explores sin partir de cero. Cuando estés listo, bórralos y crea los tuyos.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/casos" className="btn btn-primary btn-sm">
                Ver mis casos <ArrowRight size={12} />
              </Link>
              <Link href="/casos?demo=DEMO-001" className="btn btn-sm">
                <Sparkles size={12} /> Abrir caso DEMO-001
              </Link>
              <button
                className="btn btn-ghost btn-sm"
                onClick={removeDemoData}
                disabled={removingDemo}
              >
                {removingDemo ? 'Borrando…' : 'Borrar datos demo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
