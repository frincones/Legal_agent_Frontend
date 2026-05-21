'use client';

/**
 * F1-T07 (apoyo) · LexAI UX v2 — SidebarShellV2
 *
 * Wrapper client para SidebarV2 que maneja:
 * - Off-canvas drawer en mobile (igual que SidebarShell del legacy)
 * - Cierre automático al navegar
 * - Bloqueo de scroll en mobile cuando el drawer está abierto
 * - Tecla Escape para cerrar
 *
 * En desktop (md+) el sidebar es estático (primera columna del grid).
 * En mobile es un drawer flotante.
 */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';
import { SidebarV2 } from './SidebarV2';

interface SidebarShellV2Props {
  firmName?: string;
  userName?: string;
  userEmail?: string;
}

export function SidebarShellV2({ firmName, userName, userEmail }: SidebarShellV2Props) {
  const open = useUIStore((s) => s.sidebarOpen);
  const close = useUIStore((s) => s.closeSidebar);
  const pathname = usePathname();

  // Cierre automático al navegar
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Bloqueo de scroll en mobile + Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <>
      {/* Backdrop mobile */}
      <div
        aria-hidden
        onClick={close}
        className={cn(
          'fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      {/* Aside — en desktop es columna estática; en mobile es drawer flotante.
          El ancho real lo controla el motion.aside interno (SidebarV2).
          shrink-0 evita que flex-1 del contenido comprima el sidebar. */}
      <aside
        data-open={open}
        className={cn(
          'fixed inset-y-0 left-0 z-40 transform overflow-hidden shadow-lg transition-transform duration-200 ease-out',
          'md:relative md:z-auto md:translate-x-0 md:shadow-none md:shrink-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <SidebarV2
          firmName={firmName}
          userName={userName}
          userEmail={userEmail}
        />
      </aside>
    </>
  );
}
