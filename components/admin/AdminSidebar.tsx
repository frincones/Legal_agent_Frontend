'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, Wallet, Flag, LifeBuoy,
  FileText, Package, Shield, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string; icon: React.ReactNode; roles?: string[] };

const ITEMS: Item[] = [
  { href: '/saas', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
  { href: '/saas/tenants', label: 'Tenants', icon: <Building2 size={15} /> },
  { href: '/saas/users', label: 'Usuarios', icon: <Users size={15} /> },
  { href: '/saas/cartera', label: 'Cartera', icon: <Wallet size={15} /> },
  { href: '/saas/plans', label: 'Planes', icon: <Package size={15} /> },
  { href: '/saas/modules', label: 'Módulos', icon: <Package size={15} /> },
  { href: '/saas/quotas', label: 'Cuotas', icon: <Package size={15} /> },
  { href: '/saas/feature-flags', label: 'Feature flags', icon: <Flag size={15} /> },
  { href: '/saas/support', label: 'Soporte', icon: <LifeBuoy size={15} /> },
  { href: '/saas/helper-tips', label: 'Helper Tips', icon: <LifeBuoy size={15} /> },
  { href: '/saas/landing-content', label: 'Landing content', icon: <FileText size={15} /> },
  { href: '/saas/audit', label: 'Auditoría', icon: <FileText size={15} /> },
  { href: '/saas/admins', label: 'Admins SaaS', icon: <Shield size={15} />, roles: ['owner'] },
];

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-[240px] shrink-0 flex-col border-r border-line bg-bg-elev md:flex">
      <div className="flex items-center gap-2 border-b border-line px-4 py-4">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-on-accent">
          <Shield size={15} />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="serif text-[14px] font-semibold">LexAI Admin</span>
          <span className="text-[10.5px] muted">SaaS operator console</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {ITEMS.map((item) => {
          if (item.roles && !item.roles.includes(role)) return null;
          const isActive =
            item.href === '/saas'
              ? pathname === '/saas'
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'mb-0.5 flex items-center gap-2 rounded-md px-3 py-2 text-[12.5px] font-medium transition-colors',
                isActive ? 'bg-accent text-on-accent' : 'text-ink-2 hover:bg-bg-sunken hover:text-ink',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <Link href="/inicio" className="flex items-center gap-2 text-[11.5px] muted hover:text-ink">
          <ArrowLeft size={12} /> Volver a la app
        </Link>
      </div>
    </aside>
  );
}
