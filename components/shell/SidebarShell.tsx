'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';

/** Client wrapper around the Sidebar (server-rendered) that handles:
 *  - off-canvas drawer behavior on mobile (transform translate)
 *  - close-on-route-change (Next App Router doesn't unmount the layout)
 *  - body scroll lock while the drawer is open
 *  - Escape key to close.
 */
export function SidebarShell({ children }: { children: React.ReactNode }) {
  const open = useUIStore((s) => s.sidebarOpen);
  const close = useUIStore((s) => s.closeSidebar);
  const pathname = usePathname();

  // Auto-close when navigating to a new route.
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Lock body scroll while drawer is open on mobile.
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
      {/* Backdrop · mobile only, fades over content when drawer is open. */}
      <div
        aria-hidden
        onClick={close}
        className={cn(
          'fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 md:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      {/* Sidebar pane. On md+ it occupies the first grid column statically.
          On mobile it's a fixed off-canvas drawer that slides from the left. */}
      <aside
        data-open={open}
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[280px] transform overflow-hidden bg-bg shadow-3 transition-transform duration-200 ease-out',
          'md:static md:z-auto md:w-auto md:translate-x-0 md:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {children}
      </aside>
    </>
  );
}
