'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Sprint 18 · SVG chart primitives.
 *
 * Sin dependencias nuevas. Charts simples, accesibles y consistentes
 * con el design system (tokens del theme).
 */

// --------------------------------------------------------------------
// KpiCard · KPI grande con sparkline opcional
// --------------------------------------------------------------------
export function KpiCard({
  label,
  value,
  sub,
  trend,
  tone = 'default',
  className,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number[];
  tone?: 'default' | 'ok' | 'warn' | 'danger' | 'accent';
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    default: 'text-ink',
    ok: 'text-ok',
    warn: 'text-warn',
    danger: 'text-danger',
    accent: 'text-accent',
  };
  return (
    <div className={cn('surface flex flex-col gap-1.5 p-[var(--pad-card)]', className)}>
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">
        {label}
      </div>
      <div className={cn('serif tabular text-[24px] font-semibold leading-none', toneClasses[tone])}>
        {value}
      </div>
      {sub && <div className="text-[11px] muted">{sub}</div>}
      {trend && trend.length > 1 && (
        <SparkLine values={trend} className="mt-1" tone={tone} />
      )}
    </div>
  );
}

// --------------------------------------------------------------------
// SparkLine · línea simple para tendencias compactas
// --------------------------------------------------------------------
export function SparkLine({
  values,
  width = 120,
  height = 28,
  tone = 'default',
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: 'default' | 'ok' | 'warn' | 'danger' | 'accent';
  className?: string;
}) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const dx = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * dx;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke =
    tone === 'ok' ? 'rgb(var(--ok-rgb))'
    : tone === 'warn' ? 'rgb(var(--warn-rgb))'
    : tone === 'danger' ? 'rgb(var(--danger-rgb))'
    : tone === 'accent' ? 'rgb(var(--accent-rgb))'
    : 'rgb(var(--ink-3-rgb))';
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
    </svg>
  );
}

// --------------------------------------------------------------------
// BarChart · barras verticales con labels en X
// --------------------------------------------------------------------
export type BarSeries = {
  label: string;
  value: number;
  tone?: 'default' | 'ok' | 'warn' | 'danger' | 'accent';
};

export function BarChart({
  data,
  width = 480,
  height = 180,
  formatValue,
  className,
}: {
  data: BarSeries[];
  width?: number;
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
}) {
  if (data.length === 0) {
    return <div className={cn('py-6 text-center text-[12px] muted', className)}>Sin datos</div>;
  }
  const max = Math.max(1, ...data.map((d) => d.value));
  const padBottom = 28;
  const padTop = 8;
  const drawH = height - padBottom - padTop;
  const barW = Math.max(8, (width / data.length) - 8);

  const toneColor: Record<string, string> = {
    default: 'rgb(var(--ink-3-rgb))',
    ok: 'rgb(var(--ok-rgb))',
    warn: 'rgb(var(--warn-rgb))',
    danger: 'rgb(var(--danger-rgb))',
    accent: 'rgb(var(--accent-rgb))',
  };

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      {/* eje X */}
      <line x1="0" x2={width} y1={height - padBottom} y2={height - padBottom}
        stroke="rgb(var(--line-rgb))" strokeWidth="1" />
      {data.map((d, i) => {
        const h = (d.value / max) * drawH;
        const x = i * (width / data.length) + (width / data.length - barW) / 2;
        const y = height - padBottom - h;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(1, h)}
              fill={toneColor[d.tone || 'accent']}
              rx="2"
            >
              <title>{`${d.label}: ${formatValue ? formatValue(d.value) : d.value}`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={height - 12}
              textAnchor="middle"
              fontSize="9"
              fill="rgb(var(--ink-3-rgb))"
            >
              {d.label}
            </text>
            <text
              x={x + barW / 2}
              y={y - 3}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="rgb(var(--ink-2-rgb))"
            >
              {formatValue ? formatValue(d.value) : d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// --------------------------------------------------------------------
// DualBarChart · 2 series superpuestas (invoiced vs collected)
// --------------------------------------------------------------------
export function DualBarChart({
  labels,
  seriesA,
  seriesB,
  labelA,
  labelB,
  width = 560,
  height = 220,
  formatValue,
  className,
}: {
  labels: string[];
  seriesA: number[];
  seriesB: number[];
  labelA: string;
  labelB: string;
  width?: number;
  height?: number;
  formatValue?: (v: number) => string;
  className?: string;
}) {
  if (labels.length === 0) {
    return <div className={cn('py-6 text-center text-[12px] muted', className)}>Sin datos</div>;
  }
  const max = Math.max(1, ...seriesA, ...seriesB);
  const padBottom = 30;
  const padTop = 22;
  const drawH = height - padBottom - padTop;
  const colW = width / labels.length;
  const barW = Math.max(6, (colW - 8) / 2);

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      {/* leyenda */}
      <g>
        <rect x="0" y="0" width="10" height="10" fill="rgb(var(--accent-rgb))" rx="2" />
        <text x="14" y="9" fontSize="10" fill="rgb(var(--ink-2-rgb))">{labelA}</text>
        <rect x="80" y="0" width="10" height="10" fill="rgb(var(--ok-rgb))" rx="2" />
        <text x="94" y="9" fontSize="10" fill="rgb(var(--ink-2-rgb))">{labelB}</text>
      </g>
      <line x1="0" x2={width} y1={height - padBottom} y2={height - padBottom}
        stroke="rgb(var(--line-rgb))" strokeWidth="1" />
      {labels.map((lab, i) => {
        const a = seriesA[i] || 0;
        const b = seriesB[i] || 0;
        const hA = (a / max) * drawH;
        const hB = (b / max) * drawH;
        const xBase = i * colW + (colW - barW * 2 - 2) / 2;
        return (
          <g key={`${lab}-${i}`}>
            <rect
              x={xBase}
              y={height - padBottom - hA}
              width={barW}
              height={Math.max(1, hA)}
              fill="rgb(var(--accent-rgb))"
              rx="2"
            >
              <title>{`${lab} · ${labelA}: ${formatValue ? formatValue(a) : a}`}</title>
            </rect>
            <rect
              x={xBase + barW + 2}
              y={height - padBottom - hB}
              width={barW}
              height={Math.max(1, hB)}
              fill="rgb(var(--ok-rgb))"
              rx="2"
            >
              <title>{`${lab} · ${labelB}: ${formatValue ? formatValue(b) : b}`}</title>
            </rect>
            <text x={i * colW + colW / 2} y={height - 12} textAnchor="middle" fontSize="9"
              fill="rgb(var(--ink-3-rgb))">
              {lab}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// --------------------------------------------------------------------
// FunnelChart · etapas en cascada (leads → matters → closed)
// --------------------------------------------------------------------
export function FunnelChart({
  stages,
  formatValue,
  className,
}: {
  stages: { label: string; value: number }[];
  formatValue?: (v: number) => string;
  className?: string;
}) {
  if (stages.length === 0) {
    return <div className={cn('py-6 text-center text-[12px] muted', className)}>Sin datos</div>;
  }
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {stages.map((s, i) => {
        const pct = (s.value / max) * 100;
        return (
          <div key={`${s.label}-${i}`} className="flex items-center gap-3">
            <div className="w-[140px] flex-none text-[11.5px] muted">{s.label}</div>
            <div className="relative h-[26px] flex-1 overflow-hidden rounded-md bg-bg-sunken">
              <div
                className="h-full rounded-md"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, rgb(var(--accent-rgb)), rgb(var(--purple-rgb)))',
                }}
              />
              <span className="absolute inset-0 flex items-center px-2 text-[12px] font-semibold tabular text-white mix-blend-difference">
                {formatValue ? formatValue(s.value) : s.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------------------
// DonutChart · distribución (won/lost/settled/abandoned · AR aging)
// --------------------------------------------------------------------
export function DonutChart({
  segments,
  size = 140,
  thickness = 18,
  formatValue,
  centerLabel,
  centerValue,
  className,
}: {
  segments: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  formatValue?: (v: number) => string;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}) {
  const total = segments.reduce((a, b) => a + (b.value || 0), 0);
  if (total === 0) {
    return <div className={cn('py-6 text-center text-[12px] muted', className)}>Sin datos</div>;
  }
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  const defaults = [
    'rgb(var(--accent-rgb))',
    'rgb(var(--ok-rgb))',
    'rgb(var(--warn-rgb))',
    'rgb(var(--danger-rgb))',
    'rgb(var(--purple-rgb))',
    'rgb(var(--ink-3-rgb))',
  ];
  let offset = 0;
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {segments.map((s, i) => {
            const frac = s.value / total;
            const dash = c * frac;
            const gap = c - dash;
            const stroke = s.color || defaults[i % defaults.length];
            const el = (
              <circle
                key={`${s.label}-${i}`}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={stroke}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
              >
                <title>{`${s.label}: ${formatValue ? formatValue(s.value) : s.value}`}</title>
              </circle>
            );
            offset += dash;
            return el;
          })}
        </g>
        {(centerValue || centerLabel) && (
          <g>
            <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fontSize="14"
              fontWeight="600" fill="rgb(var(--ink-rgb))">
              {centerValue}
            </text>
            <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fontSize="9"
              fill="rgb(var(--ink-3-rgb))">
              {centerLabel}
            </text>
          </g>
        )}
      </svg>
      <ul className="flex flex-col gap-1 text-[11.5px]">
        {segments.map((s, i) => (
          <li key={`${s.label}-${i}-leg`} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: s.color || defaults[i % defaults.length] }}
            />
            <span className="text-ink-2">{s.label}</span>
            <span className="ml-1 tabular text-ink-3">
              {formatValue ? formatValue(s.value) : s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
