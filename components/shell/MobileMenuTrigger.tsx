'use client';

import { Ic } from '@/components/atoms/icons';
import { useUIStore } from '@/lib/stores/ui-store';

/** Hamburger button shown only on mobile (md:hidden). Toggles the
 *  sidebar drawer in lib/stores/ui-store.ts. */
export function MobileMenuTrigger() {
  const toggle = useUIStore((s) => s.toggleSidebar);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Abrir menú"
      className="btn btn-icon btn-ghost btn-sm -ml-1 mr-1 shrink-0 md:hidden"
    >
      {Ic.menu}
    </button>
  );
}
