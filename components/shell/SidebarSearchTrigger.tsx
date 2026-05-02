'use client';

import { Ic } from '@/components/atoms/icons';

export const CMDK_OPEN_EVENT = 'lexai:cmdk-open';

export function openCommandPalette(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CMDK_OPEN_EVENT));
}

export function SidebarSearchTrigger() {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className="btn btn-sm mt-3 w-full justify-between"
      aria-label="Abrir buscador"
    >
      <span className="inline-flex items-center gap-2">
        {Ic.search} Buscar o ejecutar
      </span>
      <span>
        <span className="kbd">⌘</span> <span className="kbd">K</span>
      </span>
    </button>
  );
}
