'use client';

/**
 * F4-T06 · SectionResumen — Versión v2 del panel Resumen.
 * Estrategia: REESCRITA con estilo "mensaje del agente" v2.
 * Datos: pasados como props desde el Server Component (sin hook adicional).
 */

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { cn, formatCOP, formatRelative } from '@/lib/utils';
import { MatterPredictionCard } from '@/components/predictions/MatterPredictionCard';

interface SectionResumenProps {
  matterId: string;
  matter: {
    cuantia: number | null;
    etapa_procesal: string | null;
    tribunal: string | null;
    proxima_fecha: string | null;
    proxima_tipo: string | null;
    client_id: string;
  };
  cliente: {
    nombre: string;
    tax_id: string | null;
    personal_id: string | null;
    email: string | null;
    telefono: string | null;
    vip: boolean;
  } | null;
  resumenIA: string | null;
  citations: Array<{ citation_ref: string; rubro_inserted: string | null; estado: string | null }>;
  deadlines: Array<{ titulo: string; fecha: string; tipo: string | null }>;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: 'var(--v2-bg-subtle, #F2F1EC)' }}
    >
      <div className="text-[11px] font-medium" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
        {label}
      </div>
      <div
        className="mt-1 text-[20px] font-semibold leading-none tracking-tight"
        style={{ fontFamily: 'var(--v2-font-serif, Georgia, serif)', color: 'var(--v2-text-primary, #1A1916)' }}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-[11px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function SectionResumen({ matterId, matter, cliente, resumenIA, citations, deadlines }: SectionResumenProps) {
  const diasProximo = matter.proxima_fecha
    ? Math.max(0, Math.round((new Date(matter.proxima_fecha).getTime() - Date.now()) / (24 * 3600 * 1000)))
    : null;

  return (
    <div className="space-y-5">
      {/* Predicción */}
      <MatterPredictionCard matterId={matterId} />

      {/* Stats clave */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {matter.cuantia !== null && (
          <StatCard label="Cuantía estimada" value={formatCOP(matter.cuantia)} sub="prestaciones + indemnización" />
        )}
        <StatCard label="Etapa" value={matter.etapa_procesal ?? '—'} sub={matter.tribunal ?? undefined} />
        {diasProximo !== null && (
          <StatCard
            label="Plazo crítico"
            value={`${diasProximo} días`}
            sub={matter.proxima_tipo ?? undefined}
          />
        )}
      </div>

      {/* Resumen IA */}
      {resumenIA && (
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: 'var(--v2-bg-muted, #E8E7E1)', background: 'var(--v2-bg-surface, #FFFFFF)' }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: 'rgba(125, 90, 200, 0.1)',
                color: 'rgb(100, 60, 180)',
              }}
            >
              Resumen IA · gpt-4o
            </span>
          </div>
          <p
            className="text-[14px] leading-relaxed"
            style={{
              fontFamily: 'var(--v2-font-serif, Georgia, serif)',
              color: 'var(--v2-text-primary, #1A1916)',
            }}
          >
            {resumenIA}
          </p>
          <div
            className="mt-3 flex items-start gap-1.5 rounded-md px-3 py-2 text-[11px] leading-snug"
            style={{ background: 'var(--v2-bg-subtle, #F2F1EC)', color: 'var(--v2-text-secondary, #4A4944)' }}
          >
            <ShieldCheck size={12} className="mt-0.5 flex-none" aria-hidden="true" />
            Resumen generado con IA. No constituye representación legal.
          </div>
        </div>
      )}

      {/* Cliente */}
      {cliente && (
        <div>
          <h3
            className="mb-2 text-[13px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
          >
            Cliente
          </h3>
          <Link
            href={`/clientes/${matter.client_id}`}
            className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-[var(--v2-bg-subtle,#F2F1EC)]"
            style={{ borderColor: 'var(--v2-bg-muted, #E8E7E1)' }}
          >
            <div
              className="grid h-10 w-10 flex-none place-items-center rounded-full text-[13px] font-semibold text-white"
              style={{ background: 'var(--v2-accent-copper, #B8763C)' }}
            >
              {cliente.nombre.split(' ').slice(0, 2).map((s) => s[0]).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                {cliente.nombre}
              </div>
              <div className="text-[11.5px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                {cliente.tax_id ?? cliente.personal_id ?? ''}{' '}
                {cliente.email ?? cliente.telefono ?? ''}
              </div>
            </div>
            {cliente.vip && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: 'var(--v2-brand-navy-soft, #E8EDF7)', color: 'var(--v2-brand-navy, #0E2A5E)' }}
              >
                VIP
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Citas verificadas */}
      {citations.length > 0 && (
        <div>
          <h3
            className="mb-2 text-[13px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
          >
            Sentencias citadas ({citations.length})
          </h3>
          <div className="space-y-2">
            {citations.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{ borderColor: 'var(--v2-bg-muted, #E8E7E1)' }}
              >
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{ background: 'var(--v2-accent-copper, #B8763C)' }}
                  aria-hidden="true"
                />
                <span className="flex-1 font-mono text-[11px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                  {c.citation_ref}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                  {c.rubro_inserted ?? ''}
                </span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                    c.estado === 'vigente' || c.estado === 'verificada'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700',
                  )}
                >
                  {c.estado ?? 'pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos plazos */}
      {deadlines.length > 0 && (
        <div>
          <h3
            className="mb-2 text-[13px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
          >
            Próximos plazos
          </h3>
          <div className="divide-y" style={{ borderColor: 'var(--v2-bg-muted, #E8E7E1)' }}>
            {deadlines.slice(0, 5).map((d, i) => {
              const dias = Math.round((new Date(d.fecha).getTime() - Date.now()) / (24 * 3600 * 1000));
              const urgent = dias <= 5;
              const warn = dias <= 14 && !urgent;
              return (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div
                    className="w-14 text-center text-[13px] font-semibold"
                    style={{
                      fontFamily: 'var(--v2-font-serif, Georgia, serif)',
                      color: urgent ? 'var(--danger, #d32f2f)' : warn ? 'var(--warn, #f59e0b)' : 'var(--v2-text-primary, #1A1916)',
                    }}
                  >
                    {new Date(d.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px]" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                      {d.titulo}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                      {dias >= 0 ? `en ${dias} días` : `hace ${Math.abs(dias)} días`}
                      {d.tipo ? ` · ${d.tipo}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
