'use client';

/**
 * components/admin/pipeline/RealtimeStatusBadge.tsx
 *
 * Badge que muestra el estado de health global del pipeline + ultima
 * actualizacion. Auto-refresh cada 10 segundos.
 */

import { useEffect, useState } from 'react';

interface RealtimeStatusBadgeProps {
  health: 'healthy' | 'degraded' | 'critical';
  source: 'backend' | 'mock' | 'mock_fallback';
  lastUpdated: Date;
}

const HEALTH_STYLES: Record<RealtimeStatusBadgeProps['health'], { bg: string; dot: string; label: string }> = {
  healthy: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Healthy',
  },
  degraded: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Degraded',
  },
  critical: {
    bg: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    label: 'Critical',
  },
};

export function RealtimeStatusBadge({ health, source, lastUpdated }: RealtimeStatusBadgeProps) {
  const [, setTick] = useState(0);

  // Re-render cada segundo para actualizar "hace Xs"
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const style = HEALTH_STYLES[health];
  const secondsAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  const ageLabel = secondsAgo < 60 ? `hace ${secondsAgo}s` : `hace ${Math.floor(secondsAgo / 60)}min`;

  return (
    <div className="flex items-center gap-3 text-[12px]">
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium ${style.bg}`}>
        <span className={`h-2 w-2 rounded-full ${style.dot} animate-pulse`} aria-hidden />
        {style.label}
      </span>
      <span className="text-[var(--v2-text-tertiary,#807E76)]">
        Actualizado {ageLabel}
        {source !== 'backend' && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            {source === 'mock' ? 'MOCK' : 'BACKEND OFFLINE'}
          </span>
        )}
      </span>
    </div>
  );
}
