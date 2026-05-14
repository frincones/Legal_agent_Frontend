'use client';

import { cn } from '@/lib/utils';

const ROLE_BADGE_CLS: Record<string, string> = {
  owner: 'chip-purple',
  admin: 'chip-accent',
  support: 'chip-warn',
  readonly: 'chip-neutral',
};

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  support: 'Support',
  readonly: 'Read-only',
};

export function AdminTopBar({
  adminEmail,
  adminRole,
  fullName,
}: {
  adminEmail: string;
  adminRole: string;
  fullName: string | null;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-bg-elev/80 px-5 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider muted">Panel SaaS Admin</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('chip text-[10px]', ROLE_BADGE_CLS[adminRole] || 'chip-neutral')}>
          {ROLE_LABEL[adminRole] || adminRole}
        </span>
        <div className="text-right">
          <div className="text-[12px] font-medium">{fullName || adminEmail}</div>
          <div className="text-[10.5px] muted">{adminEmail}</div>
        </div>
      </div>
    </header>
  );
}
