import type { ReactNode } from 'react';

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
    <header className="flex items-end gap-4 border-b border-line bg-bg px-[var(--pad-screen)] pb-4 pt-[22px]">
      <div className="min-w-0 flex-1">
        {breadcrumb && (
          <div className="mb-1 text-[11.5px] tracking-wide muted">{breadcrumb}</div>
        )}
        <h1 className="serif m-0 text-[26px] font-semibold leading-tight -tracking-[0.02em]">
          {title}
        </h1>
        {subtitle && <div className="mt-1 text-[13px] muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
    </header>
  );
}
