'use client';

/**
 * F4-T06 · SectionPartes — Partes del proceso.
 * Estrategia: REESCRITA con tokens v2, diseño en cards.
 */

interface Parte {
  rol: string;
  nombre: string;
  tax_id: string | null;
  client_id?: string | null;
  origen?: string | null;
}

interface Props {
  partes: Parte[];
}

const ROL_COLOR: Record<string, string> = {
  demandante: 'bg-[var(--v2-brand-navy-soft,#E8EDF7)] text-[var(--v2-brand-navy,#0E2A5E)]',
  demandado: 'bg-amber-50 text-amber-800',
  apoderado: 'bg-emerald-50 text-emerald-800',
  tercero: 'bg-gray-100 text-gray-700',
};

export function SectionPartes({ partes }: Props) {
  if (partes.length === 0) {
    return (
      <p className="text-[13px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
        No hay partes registradas en este caso.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {partes.map((p, i) => {
        const rolKey = p.rol.toLowerCase();
        const roleStyle = ROL_COLOR[rolKey] ?? 'bg-gray-100 text-gray-700';
        const initials = p.nombre
          .split(' ')
          .slice(0, 2)
          .map((s) => s[0])
          .join('');

        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: 'var(--v2-bg-muted, #E8E7E1)', background: 'var(--v2-bg-surface, #FFFFFF)' }}
          >
            {/* Avatar inicial */}
            <div
              className="grid h-10 w-10 flex-none place-items-center rounded-full text-[13px] font-semibold"
              style={{ background: 'var(--v2-bg-subtle, #F2F1EC)', color: 'var(--v2-text-primary, #1A1916)' }}
            >
              {initials}
            </div>

            {/* Datos */}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold" style={{ color: 'var(--v2-text-primary, #1A1916)' }}>
                {p.nombre}
              </div>
              {p.tax_id && (
                <div className="text-[11.5px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
                  {p.tax_id}
                </div>
              )}
            </div>

            {/* Rol badge */}
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${roleStyle}`}>
              {p.rol}
            </span>
          </div>
        );
      })}
    </div>
  );
}
