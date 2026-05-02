'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Ic } from '@/components/atoms/icons';
import { useVoiceStore } from '@/lib/stores/voice-store';
import { openCommandPalette } from '@/components/shell/SidebarSearchTrigger';

/** Kebab (…) menu next to the VoiceHUD spacebar hint. Exposes:
 *   · Limpiar conversación (reset transcript + tools)
 *   · Mostrar comandos (open ⌘K)
 *   · Configurar voz (settings)
 *   · Ver tools usadas en esta sesión
 */
export function VoiceMenu() {
  const router = useRouter();
  const reset = useVoiceStore((s) => s.reset);
  const tools = useVoiceStore((s) => s.tools);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items = [
    {
      label: 'Limpiar conversación',
      icon: Ic.x,
      onClick: () => {
        reset();
        toast('Conversación limpia');
        setOpen(false);
      },
    },
    {
      label: 'Mostrar comandos (⌘K)',
      icon: Ic.search,
      onClick: () => {
        openCommandPalette();
        setOpen(false);
      },
    },
    {
      label: `Tools en sesión (${tools.length})`,
      icon: Ic.bolt,
      onClick: () => {
        if (tools.length === 0) {
          toast('Aún no se han ejecutado tools en esta sesión');
        } else {
          const recent = tools.slice(-3).map((t) => t.name).join(', ');
          toast.success(`Últimas: ${recent}`);
        }
        setOpen(false);
      },
    },
    {
      label: 'Configurar voz',
      icon: Ic.setting,
      onClick: () => {
        router.push('/settings/despacho');
        setOpen(false);
      },
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="btn btn-icon btn-ghost btn-sm"
        title="Más opciones"
        aria-label="Más opciones"
        aria-expanded={open}
      >
        {Ic.dots}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 mb-2 w-[220px] overflow-hidden rounded-lg border border-line bg-bg-elev shadow-3"
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={it.onClick}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink hover:bg-bg-sunken"
            >
              <span className="text-ink-3">{it.icon}</span>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
