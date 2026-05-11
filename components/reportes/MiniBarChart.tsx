'use client';

/**
 * Tiny dependency-free bar chart SVG.
 * Acepta series con label + value, escala automáticamente, formato CO.
 */
type Bar = { label: string; value: number; color?: string };

export function MiniBarChart({
  bars,
  height = 140,
  width = 340,
}: {
  bars: Bar[];
  height?: number;
  width?: number;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const barW = bars.length > 0 ? Math.max(8, (width - 24) / bars.length - 6) : 0;

  return (
    <svg width={width} height={height} role="img" aria-label="bar chart" className="block max-w-full">
      <g>
        {bars.map((b, i) => {
          const h = Math.round(((height - 30) * b.value) / max);
          const x = 8 + i * (barW + 6);
          const y = height - 22 - h;
          const color = b.color || 'currentColor';
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={2}
                fill={color}
                opacity={0.85}
              />
              <text
                x={x + barW / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize="9"
                fill="currentColor"
                opacity={0.5}
              >
                {b.label.slice(0, 8)}
              </text>
              <text
                x={x + barW / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="currentColor"
              >
                {b.value}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
