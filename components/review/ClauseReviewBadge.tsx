'use client';

/**
 * Sprint E · ClauseReviewBadge
 * Chip GREEN/YELLOW/RED con tooltip de explicación.
 */

type Severity = 'green' | 'yellow' | 'red' | 'info';

const STYLES: Record<Severity, { color: string; label: string; emoji: string }> = {
  green:  { color: 'chip-green', label: 'OK',     emoji: '🟢' },
  yellow: { color: 'chip-amber', label: 'Atención',emoji: '🟡' },
  red:    { color: 'chip-red',   label: 'Riesgo', emoji: '🔴' },
  info:   { color: '',           label: 'Info',   emoji: 'ℹ️' },
};

export function ClauseReviewBadge({
  severity,
  reason,
  size = 'sm',
}: {
  severity: Severity;
  reason?: string | null;
  size?: 'xs' | 'sm' | 'md';
}) {
  const s = STYLES[severity] || STYLES.info;
  const sizeClass = size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-[10.5px]' : 'text-[12px]';
  return (
    <span
      className={`chip ${s.color} ${sizeClass}`}
      title={reason || s.label}
    >
      <span>{s.emoji}</span>
      <span>{s.label}</span>
    </span>
  );
}
