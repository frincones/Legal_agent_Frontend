'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, HelpCircle, Lightbulb, Sparkles, Star, Keyboard, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tip = {
  id: string;
  key: string;
  title: string;
  body: string;
  cta_label?: string | null;
  cta_href?: string | null;
  priority: number;
  category: 'tip' | 'feature' | 'warning' | 'onboarding' | 'keyboard_shortcut';
};

const CATEGORY_META: Record<string, { icon: any; cls: string }> = {
  tip: { icon: Lightbulb, cls: 'text-accent' },
  feature: { icon: Sparkles, cls: 'text-purple' },
  warning: { icon: AlertTriangle, cls: 'text-warn' },
  onboarding: { icon: Star, cls: 'text-ok' },
  keyboard_shortcut: { icon: Keyboard, cls: 'text-ink-2' },
};

const SEEN_KEY = 'lexai.helper.seen_tips';

export function LexHelper() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw) setSeen(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  // Cargar tips cuando se abre, o cuando cambia la ruta y está abierto
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams({ route: pathname, limit: '5' });
    fetch(`/api/me/helper-tips?${params}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setTips(d.items || []))
      .finally(() => setLoading(false));
  }, [open, pathname]);

  const newTipsCount = tips.filter((t) => !seen.has(t.key)).length;

  function markSeen(key: string) {
    const next = new Set(seen);
    next.add(key);
    setSeen(next);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(next))); } catch {}
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'fixed bottom-4 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full shadow-2 transition-all',
          open ? 'bg-ink text-bg' : 'bg-accent text-on-accent hover:scale-105',
        )}
        aria-label="Lex Helper"
      >
        {open ? <X size={18} /> : <HelpCircle size={20} />}
        {!open && newTipsCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-warn text-[9px] font-bold text-white px-1">
            {newTipsCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-40 w-[360px] max-w-[calc(100vw-32px)] max-h-[70vh] overflow-hidden">
          <div className="surface shadow-2 flex flex-col">
            <header className="flex items-center gap-2 border-b border-line bg-bg-elev p-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
                <HelpCircle size={14} />
              </span>
              <div className="flex-1">
                <div className="text-[12.5px] font-semibold">Lex Helper</div>
                <div className="text-[10.5px] muted">Tips para "{pathname}"</div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="text-center text-[12px] muted py-4">Cargando…</div>
              ) : tips.length === 0 ? (
                <div className="text-center text-[12px] muted py-6">
                  No hay tips para esta pantalla.
                  <div className="mt-2 text-[10.5px]">¿Necesitas ayuda? Escribe <kbd className="mono">?</kbd> en cualquier momento.</div>
                </div>
              ) : (
                <ul className="grid gap-2">
                  {tips.map((tip) => {
                    const meta = (CATEGORY_META[tip.category] || CATEGORY_META.tip)!;
                    const Icon = meta.icon;
                    const isNew = !seen.has(tip.key);
                    return (
                      <li
                        key={tip.id}
                        className={cn(
                          'rounded-md border border-line p-3 text-[12px]',
                          isNew && 'border-accent/50 bg-accent-soft/30',
                        )}
                      >
                        <header className="flex items-start gap-2">
                          <Icon size={13} className={cn('shrink-0 mt-0.5', meta.cls)} />
                          <strong className="flex-1 font-semibold">{tip.title}</strong>
                          {isNew && <span className="chip chip-accent text-[9px]">nuevo</span>}
                        </header>
                        <p className="mt-1 text-[11.5px] text-ink-2 leading-relaxed">{tip.body}</p>
                        {tip.cta_href && (
                          <Link
                            href={tip.cta_href}
                            onClick={() => { markSeen(tip.key); setOpen(false); }}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                          >
                            {tip.cta_label || 'Ir'} <ExternalLink size={10} />
                          </Link>
                        )}
                        {!tip.cta_href && isNew && (
                          <button
                            onClick={() => markSeen(tip.key)}
                            className="mt-2 text-[10.5px] muted hover:text-ink"
                          >
                            Entendido
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="border-t border-line bg-bg-elev/50 p-2 text-center">
              <a
                href="mailto:hello@lexai.co"
                className="text-[10.5px] muted hover:text-ink"
              >
                ¿No encuentras lo que buscas? Escríbenos →
              </a>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
