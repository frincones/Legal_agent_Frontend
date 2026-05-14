'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type ActiveUser = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  location_kind: string;
  location_ref: string | null;
  last_heartbeat: string | null;
  is_self: boolean;
};

/**
 * Sprint 16 · Muestra avatares de usuarios activos en este matter (TTL 90s).
 *
 * Polling cada 20s. Es ligero · sólo trae avatar+nombre. El backend RPC
 * `lexai_active_users` filtra TTL ya.
 */
export function PresenceBar({
  matterId,
  pollMs = 20_000,
  className,
}: {
  matterId: string;
  pollMs?: number;
  className?: string;
}) {
  const [users, setUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const r = await fetch(`/api/presence/active?matter_id=${matterId}`, { cache: 'no-store' });
        if (!cancelled && r.ok) {
          const data = await r.json();
          setUsers(data.items || []);
        }
      } catch {
        /* ignore */
      }
    };

    void refresh();
    const t = setInterval(refresh, pollMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [matterId, pollMs]);

  const others = users.filter((u) => !u.is_self);
  if (others.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-1', className)} title="Personas viendo este caso ahora">
      <div className="flex -space-x-1.5">
        {others.slice(0, 4).map((u) => (
          <Avatar key={u.user_id} u={u} />
        ))}
      </div>
      {others.length > 4 && (
        <span className="ml-1 text-[11px] muted">+{others.length - 4}</span>
      )}
      <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] text-ink-3">
        <span className="dot bg-ok" />
        {others.length === 1 ? '1 viendo ahora' : `${others.length} viendo ahora`}
      </span>
    </div>
  );
}

function Avatar({ u }: { u: ActiveUser }) {
  const initials = (u.full_name || '?')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className="grid h-6 w-6 place-items-center rounded-full border-2 border-bg bg-accent text-[10px] font-semibold text-white"
      title={`${u.full_name} · ${u.location_kind}`}
    >
      {u.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={u.avatar_url} alt={u.full_name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
