'use client';

/**
 * F4-T06 · SectionCalendario — Calendario / plazos del caso.
 * Estrategia: REESCRITA con tokens v2.
 */

import { cn } from '@/lib/utils';
import { CalendarClock } from 'lucide-react';

interface Deadline {
  titulo: string;
  fecha: string;
  tipo: string | null;
  completado?: boolean;
}

interface Props {
  deadlines: Deadline[];
}

export function SectionCalendario({ deadlines }: Props) {
  if (deadlines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CalendarClock size={28} style={{ color: 'var(--v2-bg-muted, #E8E7E1)' }} aria-hidden="true" />
        <p className="text-[13px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
          Sin fechas en el calendario de este caso.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: 'var(--v2-bg-muted, #E8E7E1)' }}>
      {deadlines.map((d, i) => {
        const dias = Math.round((new Date(d.fecha).getTime() - Date.now()) / (24 * 3600 * 1000));
        const urgent = dias <= 5 && !d.completado;
        const warn = dias <= 14 && !urgent && !d.completado;

        return (
          <div key={i} className="flex items-center gap-4 py-3">
            {/* Fecha */}
            <div className="w-16 flex-none text-center">
              <div
                className="text-[14px] font-semibold leading-none"
                style={{
                  fontFamily: 'var(--v2-font-serif, Georgia, serif)',
                  color: urgent
                    ? 'var(--danger, #d32f2f)'
                    : warn
                    ? '#f59e0b'
                    : 'var(--v2-text-primary, #1A1916)',
                }}
              >
                {new Date(d.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
              </div>
              <div className="mt-0.5 text-[10.5px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                {new Date(d.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Separador vertical */}
            <div
              className="h-8 w-px flex-none"
              style={{ background: 'var(--v2-bg-muted, #E8E7E1)' }}
              aria-hidden="true"
            />

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                {d.titulo}
              </div>
              <div className="text-[11.5px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                {dias >= 0 ? `en ${dias} días` : `hace ${Math.abs(dias)} días`}
                {d.tipo ? ` · ${d.tipo}` : ''}
              </div>
            </div>

            {/* Badge urgencia */}
            {urgent && (
              <span className="flex-none rounded-full bg-red-100 px-2 py-0.5 text-[10.5px] font-medium text-red-700">
                Urgente
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
