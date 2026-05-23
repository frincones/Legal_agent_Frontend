'use client';

/**
 * F1-T03 · LexAI UX v2 — SidebarHilosList
 *
 * Lista de threads (hilos) recientes del asistente, agrupados por fecha.
 *
 * Data source: indice local en localStorage (`lib/v2/threadIndex`). El
 * backend de LexAI no expone (al dia de hoy) un endpoint que devuelva los
 * hilos del usuario agrupados por session_id con titulo + timestamp, asi
 * que el composer escribe el indice cada vez que termina un turno y este
 * componente lo lee.
 *
 * Si en el futuro el backend expone GET /v1/threads se puede reemplazar
 * el fetch a localStorage por un fetch al endpoint sin tocar la UI.
 */
import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readThreadIndex, removeThread, type ThreadIndexEntry } from '@/lib/v2/threadIndex';

interface GroupedThreads {
  hoy: ThreadIndexEntry[];
  ayer: ThreadIndexEntry[];
  semana: ThreadIndexEntry[];
  antes: ThreadIndexEntry[];
}

function groupByDate(threads: ThreadIndexEntry[]): GroupedThreads {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 7 * 86400000);

  const groups: GroupedThreads = { hoy: [], ayer: [], semana: [], antes: [] };

  for (const t of threads) {
    const d = new Date(t.last_message_at);
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
  const [threads, setThreads] = useState<ThreadIndexEntry[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const router = useRouter();

  const refresh = useCallback(() => {
    setThreads(readThreadIndex());
  }, []);

  // Hidratar tras el mount (evita mismatch SSR/CSR — localStorage no existe en server).
  useEffect(() => {
    refresh();
    setHasHydrated(true);
  }, [refresh]);

  // Re-fetch cuando el composer termina un turno
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('lexai:thread-completed', handler);
    window.addEventListener('lexai:new-thread', handler);
    return () => {
      window.removeEventListener('lexai:thread-completed', handler);
      window.removeEventListener('lexai:new-thread', handler);
    };
  }, [refresh]);

  const handleOpenThread = useCallback((session_id: string) => {
    // Marcar el session_id objetivo en localStorage y navegar a inicio.
    // El composer en /v2/inicio se monta con freshStart=true; lee
    // 'lexai-v2-pending-open-session' para saber que debe cargar este hilo
    // en vez de empezar limpio. El flag se consume al leerse.
    try {
      localStorage.setItem('lexai-v2-pending-open-session', session_id);
      localStorage.setItem('lexai-v2-current-session', session_id);
      // Promover el snapshot al hilo activo para que el composer lo lea.
      const stored = localStorage.getItem(`lexai-v2-thread-msgs:${session_id}`);
      if (stored) {
        localStorage.setItem('lexai-v2-current-thread', stored);
      }
    } catch {
      /* noop */
    }
    // Para casos en que el composer ya esta montado (usuario ya esta en
    // /v2/inicio), el handler de 'lexai:open-thread' carga el hilo sin remount.
    window.dispatchEvent(new CustomEvent('lexai:open-thread', { detail: { session_id } }));
    router.push('/v2/inicio');
  }, [router]);

  const handleDelete = useCallback((session_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    removeThread(session_id);
    refresh();
    toast.success('Hilo eliminado');
  }, [refresh]);

  // En colapsado, ocultar la sección completa
  if (collapsed) return null;

  // Pre-hydration: render placeholder (sin localStorage) para evitar mismatch
  if (!hasHydrated) {
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

  const renderGroup = (label: string, items: ThreadIndexEntry[]) => {
    if (items.length === 0) return null;
    return (
      <div key={label} className="mb-2">
        <div className="px-[10px] pb-[4px] pt-[8px] text-[10px] font-semibold uppercase tracking-wider text-[var(--v2-text-tertiary,#807E76)]">
          {label}
        </div>
        <div className="flex flex-col gap-0.5">
          {items.map((t) => (
            <div
              key={t.session_id}
              className="group flex items-center gap-1 rounded-lg px-[8px] py-[6px] cursor-pointer hover:bg-[var(--v2-bg-subtle,#F2F1EC)] transition-colors"
              role="button"
              tabIndex={0}
              onClick={() => handleOpenThread(t.session_id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenThread(t.session_id);
                }
              }}
              title={t.title}
            >
              <MessageSquare
                size={14}
                strokeWidth={1.8}
                className="shrink-0 text-[var(--v2-text-tertiary,#807E76)]"
                aria-hidden
              />
              <span className="flex-1 min-w-0 truncate text-[13px] leading-tight text-[var(--v2-text-secondary,#4A4944)]">
                {t.title || 'Hilo sin título'}
              </span>
              <button
                type="button"
                onClick={(e) => handleDelete(t.session_id, e)}
                aria-label="Eliminar hilo"
                className="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded"
              >
                <Trash2 size={12} aria-hidden className="text-[var(--v2-text-tertiary,#807E76)]" />
              </button>
            </div>
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
