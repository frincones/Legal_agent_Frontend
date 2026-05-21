'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'lexai.pwa_install.dismissed_at';
const DISMISS_TTL_DAYS = 14;

export function PWAInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const at = localStorage.getItem(DISMISS_KEY);
      if (at && Date.now() - parseInt(at, 10) < DISMISS_TTL_DAYS * 24 * 3600 * 1000) {
        return;
      }
    } catch {}
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (hidden || !evt) return null;

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === 'dismissed') {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    }
    setEvt(null);
    setHidden(true);
  }

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setHidden(true);
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 w-[min(360px,calc(100vw-2rem))] surface border-accent/40 p-3 shadow-2xl md:bottom-6">
      <div className="flex items-start gap-3">
        <Download size={18} className="mt-0.5 flex-none text-accent" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">Instala LexAI como app</div>
          <p className="mt-0.5 text-[12px] muted">
            Acceso rápido desde tu pantalla de inicio · funciona sin conexión en juzgado.
          </p>
          <div className="mt-2 flex gap-2">
            <button className="btn btn-primary" onClick={install}>Instalar</button>
            <button className="btn" onClick={dismiss}>Más tarde</button>
          </div>
        </div>
        <button onClick={dismiss} className="text-ink-3 hover:text-ink"><X size={14} aria-hidden="true" /></button>
      </div>
    </div>
  );
}
