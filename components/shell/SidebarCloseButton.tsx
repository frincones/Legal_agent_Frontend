'use client';

import { Ic } from '@/components/atoms/icons';
import { useUIStore } from '@/lib/stores/ui-store';

/** Close (✕) button visible only on mobile inside the drawer header. */
export function SidebarCloseButton() {
  const close = useUIStore((s) => s.closeSidebar);
  return (
    <button
      type="button"
      onClick={close}
      aria-label="Cerrar menú"
      className="btn btn-icon btn-ghost btn-sm ml-auto md:hidden"
    >
      {Ic.x}
    </button>
  );
}
