'use client';

import Link from 'next/link';
import { Ic } from '@/components/atoms/icons';
import { openCommandPalette } from '@/components/shell/SidebarSearchTrigger';

export function ClientesTopActions() {
  return (
    <>
      <button
        type="button"
        onClick={openCommandPalette}
        className="btn"
        title="Cmd+K para buscar"
      >
        {Ic.search} Buscar
      </button>
      <Link href="/clientes/nuevo" className="btn btn-primary">
        {Ic.plus} Nuevo cliente
      </Link>
    </>
  );
}
