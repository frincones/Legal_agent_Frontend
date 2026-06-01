'use client';

/**
 * Sprint M21.S3.C · MatterSelector
 *
 * Dropdown ligero para elegir un matter activo dentro del composer.
 * Lee /v2/matters (lista activos) y emite onChange con matter_id.
 *
 * Puede pasarse al composer como prop para que /v1/documents/v2/generate
 * incluya el matter_id en el body (Sprint 4+ wiring; ahora solo selecciona).
 */

import { useEffect, useState } from 'react';
import { listMattersV2, type MatterV2 } from '@/lib/api/v2/matters';

type Props = {
  value?: string | null;
  onChange?: (matter_id: string | null, matter: MatterV2 | null) => void;
  placeholder?: string;
  className?: string;
};

export default function MatterSelector({
  value, onChange,
  placeholder = 'Sin caso vinculado',
  className,
}: Props) {
  const [matters, setMatters] = useState<MatterV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMattersV2({ active_only: true, limit: 50 })
      .then((r) => { if (!cancelled) setMatters(r.items); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={`text-xs text-zinc-500 ${className ?? ''}`}>Cargando casos…</div>
    );
  }
  if (error) {
    return (
      <div className={`text-xs text-red-600 ${className ?? ''}`} title={error}>
        Error casos
      </div>
    );
  }

  return (
    <select
      className={`text-xs rounded border border-zinc-300 bg-white px-2 py-1 focus:outline-none focus:border-zinc-900 ${className ?? ''}`}
      value={value ?? ''}
      onChange={(e) => {
        const id = e.target.value || null;
        const m = matters.find((x) => x.matter_id === id) ?? null;
        onChange?.(id, m);
      }}
    >
      <option value="">{placeholder}</option>
      {matters.map((m) => (
        <option key={m.matter_id} value={m.matter_id}>
          {m.title} · {m.area}{m.side ? ` (${m.side})` : ''}
        </option>
      ))}
    </select>
  );
}
