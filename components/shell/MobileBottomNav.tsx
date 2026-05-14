'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, FileText, Home, Inbox, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Sprint 12 · Mobile bottom navigation.
 * Solo visible en viewports < 768px. NO toca el sidebar desktop.
 * 5 entradas críticas: Inicio · Casos · Canvas · Inbox · Insights.
 */
const ITEMS = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/casos', label: 'Casos', icon: Briefcase },
  { href: '/canvas', label: 'Canvas', icon: FileText },
  { href: '/notificaciones', label: 'Inbox', icon: Inbox },
  { href: '/insights', label: 'Insights', icon: Sparkles },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  // No mostrar en portal cliente público o login
  if (
    pathname?.startsWith('/portal/') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup')
  ) {
    return null;
  }
  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-line bg-bg/90 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {ITEMS.map((it) => {
        const Icon = it.icon;
        const active =
          pathname === it.href ||
          (it.href !== '/inicio' && pathname?.startsWith(it.href));
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px]',
              active ? 'text-accent' : 'text-ink-3',
            )}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
