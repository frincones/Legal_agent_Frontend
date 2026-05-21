'use client';

/**
 * F1-T03 · LexAI UX v2 — SidebarHilosList
 *
 * Lista de threads (hilos) recientes del asistente, agrupados por fecha.
 *
 * Data source: endpoint /api/assistant/threads (lista threads del firm).
 * Si el endpoint no existe aún, se muestra estado vacío con mensaje.
 *
 * TODO (F2): conectar con el endpoint real de threads cuando esté disponible.
 * El backend necesitaría: GET /v1/threads → lista { id, title, created_at }
 */
import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { SidebarItemV2 } from './SidebarItemV2';

interface Thread {
  id: string;
  title: string;
  created_at: string;
}

interface GroupedThreads {
  hoy: Thread[];
  ayer: Thread[];
  semana: Thread[];
  antes: Thread[];
}

function groupByDate(threads: Thread[]): GroupedThreads {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 7 * 86400000);

  const groups: GroupedThreads = { hoy: [], ayer: [], semana: [], antes: [] };

  for (const t of threads) {
    const d = new Date(t.created_at);
    if (d >= startOfToday) groups.hoy.push(t);
    else if (d >= startOfYesterday) groups.ayer.push(t);
    else if (d >= startOfWeek) groups.semana.push(t);
    else groups.antes.push(t);
  }

  return groups;
}

interface SidebarHilosListProps {
  collapsed?: boolean;
}

export function SidebarHilosList({ collapsed = false }: SidebarHilosListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // TODO: reemplazar con endpoint real GET /api/assistant/threads
        // cuando el backend tenga GET /v1/threads disponible.
        // El endpoint debe retornar: { threads: Array<{ id, title, created_at }> }
        const res = await fetch('/api/assistant/threads', { cache: 'no-store' });
        if (!res.ok) throw new Error('no threads endpoint');
        const data = await res.json();
        if (!cancelled) setThreads(data.threads ?? []);
      } catch {
        // Endpoint no disponible aún — estado vacío silencioso
        if (!cancelled) setThreads([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // En colapsado, ocultar la sección completa
  if (collapsed) return null;

  if (loading) {
    return (
      <div className="px-2 py-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="mb-1 h-[32px] rounded-lg bg-[var(--v2-bg-subtle,#F2F1EC)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="px-3 py-3">
        <p className="text-[12px] leading-relaxed text-[var(--v2-text-tertiary,#807E76)]">
          Aún no tiene hilos. Empiece preguntando algo a LexAI.
        </p>
      </div>
    );
  }

  const groups = groupByDate(threads);

  const renderGroup = (label: string, items: Thread[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label} className="mb-2">
        <div className="px-[10px] pb-[4px] pt-[8px] text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
          {label}
        </div>
        <div className="flex flex-col gap-0.5">
          {items.map((t) => (
            <SidebarItemV2
              key={t.id}
              icon={MessageSquare}
              label={t.title || 'Hilo sin título'}
              href={`/threads/${t.id}`}
              collapsed={false}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-y-auto max-h-[220px]">
      {renderGroup('Hoy', groups.hoy)}
      {renderGroup('Ayer', groups.ayer)}
      {renderGroup('Esta semana', groups.semana)}
      {renderGroup('Antes', groups.antes)}
    </div>
  );
}
