'use client';

/**
 * TaskCard — background task progress (multi-agent generation, ingestion, etc.).
 *
 * Renders inside the thread or the activity sidebar tab. Per V3 spec: voice
 * sessions don't block during long tasks · the orchestrator emits stage
 * events and the parent (AssistantSidebar) updates progress here.
 */

import type { TaskCardData } from '@/lib/assistant/types';

interface TaskCardProps {
  task: TaskCardData;
  onCancel?: () => void;
  onResume?: () => void;
}

export function TaskCard({ task, onCancel, onResume }: TaskCardProps) {
  const isRunning = task.status === 'running';
  const isPaused = task.status === 'paused';
  const isDone = task.status === 'done';
  const isCancelled = task.status === 'cancelled';
  const isError = task.status === 'error';

  const progress = Math.min(100, Math.max(0, task.progress ?? 0));
  const eta = task.etaSeconds && task.etaSeconds > 0 ? `~${task.etaSeconds}s` : null;

  return (
    <div
      className={[
        'border-line bg-bg-elev rounded-md border p-3',
        isDone ? 'opacity-70' : '',
      ].join(' ')}
      role="status"
      aria-live="polite"
      aria-label={`Tarea en curso: ${task.title}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-ink-3 text-[10px] uppercase tracking-wide">
            {isRunning ? '⏱ En curso' : isPaused ? '⏸ Pausada' :
             isDone ? '✓ Completada' :
             isCancelled ? '⛔ Cancelada' : '⚠️ Error'}
          </div>
          <div className="text-ink mt-0.5 text-sm font-medium leading-tight">
            {task.title}
          </div>
          {task.step && (
            <div className="text-ink-2 mt-0.5 text-xs">{task.step}</div>
          )}
        </div>
        {eta && isRunning && (
          <span className="text-ink-3 text-[11px]">{eta}</span>
        )}
      </div>

      {(isRunning || isPaused) && task.progress !== undefined && (
        <div className="bg-bg-sunken h-1.5 w-full overflow-hidden rounded-full">
          <div
            className={[
              'h-full transition-all duration-500',
              isRunning ? 'bg-accent' : 'bg-warn',
            ].join(' ')}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {(isRunning || isPaused || isError) && (onCancel || onResume) && (
        <div className="mt-2 flex items-center gap-1.5">
          {isPaused && onResume && (
            <button
              type="button"
              onClick={onResume}
              className="text-ink-2 hover:bg-bg-sunken hover:text-ink rounded-sm px-2 py-1 text-xs"
            >
              ▶ Reanudar
            </button>
          )}
          {(isRunning || isPaused) && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-ink-3 hover:text-ink hover:bg-bg-sunken rounded-sm px-2 py-1 text-xs"
            >
              ✕ Detener
            </button>
          )}
        </div>
      )}
    </div>
  );
}
