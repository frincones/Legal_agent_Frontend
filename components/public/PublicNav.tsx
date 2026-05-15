import Link from 'next/link';
import { Logo } from '@/components/atoms/Logo';

export function PublicNav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center gap-2 hover:opacity-80">
        <Logo size={22} />
      </Link>
      <nav className="hidden items-center gap-5 md:flex">
        <Link href="/pricing" className="text-[12.5px] text-ink-2 hover:text-ink">
          Precios
        </Link>
        <Link href="/customers" className="text-[12.5px] text-ink-2 hover:text-ink">
          Clientes
        </Link>
        <Link href="/changelog" className="text-[12.5px] text-ink-2 hover:text-ink">
          Cambios
        </Link>
        <Link href="/seguridad" className="text-[12.5px] text-ink-2 hover:text-ink">
          Seguridad
        </Link>
        <Link href="/status" className="text-[12.5px] text-ink-2 hover:text-ink">
          Status
        </Link>
        <Link href="/tramites" className="text-[12.5px] text-ink-3 hover:text-ink">
          Trámites ciudadanos
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/login" className="text-[12.5px] text-ink-3 hover:text-ink">
          Iniciar sesión
        </Link>
        <Link href="/signup" className="btn btn-primary btn-sm">
          Empezar gratis
        </Link>
      </div>
    </header>
  );
}
