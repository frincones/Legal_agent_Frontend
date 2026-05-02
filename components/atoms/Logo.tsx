import { cn } from '@/lib/utils';

export function Logo({
  size = 18,
  label = true,
  className,
}: {
  size?: number;
  label?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-serif font-semibold tracking-tight text-ink',
        className,
      )}
      style={{ fontSize: size }}
    >
      <span
        className="inline-flex items-center justify-center rounded-[7px] bg-ink text-bg-elev font-serif font-semibold leading-none"
        style={{ width: size + 6, height: size + 6, fontSize: size - 2, paddingTop: 1 }}
      >
        L
      </span>
      {label && <span className="-tracking-[0.01em]">LexAI</span>}
    </span>
  );
}
