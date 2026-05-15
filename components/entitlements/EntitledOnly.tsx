'use client';

import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { useEntitlements } from '@/lib/entitlements/EntitlementsContext';
import { cn } from '@/lib/utils';

export function EntitledOnly({
  module,
  children,
  fallback,
  silent = false,
}: {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  silent?: boolean; // si true, no muestra nada cuando no tiene · útil en sidebar
}) {
  const { has, loading } = useEntitlements();

  if (loading) return <>{children}</>;
  if (has(module)) return <>{children}</>;
  if (silent) return null;
  if (fallback) return <>{fallback}</>;

  return <UpgradeCard module={module} />;
}

export function UpgradeCard({ module }: { module: string }) {
  return (
    <div className="surface flex flex-col items-center gap-3 p-8 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Lock size={18} />
      </span>
      <h3 className="serif text-[18px] font-semibold">Funcionalidad no incluida en tu plan</h3>
      <p className="max-w-md text-[12.5px] text-ink-2 leading-relaxed">
        <code className="mono text-accent">{module}</code> no está disponible en tu plan actual.
        Mejora a un plan superior para desbloquearlo.
      </p>
      <Link href="/settings/billing" className="btn btn-primary btn-md">
        <Sparkles size={13} /> Ver planes
      </Link>
    </div>
  );
}

/**
 * Hook · gate fácil para páginas completas. Si no tiene módulo, redirige a /upgrade.
 * Uso:
 *   useGateModule('canvas')
 */
export function ModuleGate({ module, children }: { module: string; children: React.ReactNode }) {
  return (
    <EntitledOnly module={module} fallback={<UpgradeCard module={module} />}>
      {children}
    </EntitledOnly>
  );
}
