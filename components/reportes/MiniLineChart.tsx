'use client';

type Point = { label: string; value: number };

/**
 * Minimal line/area chart, dependency-free.
 */
export function MiniLineChart({
  points,
  height = 140,
  width = 480,
  color = 'currentColor',
}: {
  points: Point[];
  height?: number;
  width?: number;
  color?: string;
}) {
  if (points.length === 0) {
    return <div className="text-[12px] muted">Sin datos.</div>;
  }
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = points.length > 1 ? (width - 20) / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = 10 + i * step;
    const y = height - 22 - ((height - 30) * p.value) / max;
    return [x, y];
  });
  const path = coords.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  const areaPath = `${path} L ${coords[coords.length - 1]![0]} ${height - 22} L ${coords[0]![0]} ${height - 22} Z`;

  return (
    <svg width={width} height={height} role="img" aria-label="line chart" className="block max-w-full">
      <path d={areaPath} fill={color} opacity={0.12} />
      <path d={path} stroke={color} strokeWidth={2} fill="none" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={color} />
      ))}
      {points.length <= 14 && points.map((p, i) => {
        const [x] = coords[i] || [0, 0];
        return (
          <text key={`l-${i}`} x={x} y={height - 6} textAnchor="middle" fontSize="9" fill="currentColor" opacity={0.5}>
            {p.label.slice(-5)}
          </text>
        );
      })}
    </svg>
  );
}
