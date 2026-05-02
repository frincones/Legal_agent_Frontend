import type { ReactNode } from 'react';
import { MobileMenuTrigger } from './MobileMenuTrigger';

export function TopBar({
  breadcrumb,
  title,
  subtitle,
  actions,
}: {
  breadcrumb?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-bg px-[var(--pad-screen)] pb-3 pt-3 md:items-end md:gap-4 md:pb-4 md:pt-[22px]">
      <MobileMenuTrigger />
      <div className="min-w-0 flex-1">
        {breadcrumb && (
          <div className="mb-1 hidden truncate text-[11.5px] tracking-wide muted md:block">
            {breadcrumb}
          </div>
        )}
        <h1 className="serif m-0 truncate text-[18px] font-semibold leading-tight -tracking-[0.02em] md:text-[26px]">
          {title}
        </h1>
        {subtitle && (
          <div className="mt-1 hidden truncate text-[12px] muted md:block md:text-[13px]">
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-none flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
