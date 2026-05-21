'use client';

/**
 * F4-T06 · SectionTareas — Tareas del caso.
 * Estrategia: WRAPPER LEGACY con container v2.
 */

import { TasksList } from '@/components/tasks/TasksList';

interface Props {
  matterId: string;
}

export function SectionTareas({ matterId }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[12px]" style={{ color: 'var(--v2-text-secondary, #4A4944)' }}>
        Tareas asignables al despacho · plazo + prioridad + responsable.
      </p>
      <TasksList matterId={matterId} showMatterColumn={false} />
    </div>
  );
}
