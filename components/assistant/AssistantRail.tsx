'use client';

/**
 * AssistantRail — collapsed sidebar state (56px wide), always visible.
 *
 * Houses 4 entry points:
 *   1. Voice orb       — click to expand + activate voice
 *   2. Chat icon       — click to expand in text mode
 *   3. Cmd+K shortcut  — opens the existing CommandPalette (no expansion)
 *   4. Activity log    — opens expanded sidebar on Activity tab
 *
 * Per U3: in mobile the rail is replaced by a floating orb (handled by
 * AssistantSidebar via breakpoint). This component only renders the
 * desktop / tablet rail.
 *
 * Width constant: SIDEBAR_RAIL_WIDTH = 56px (matches Linear / Notion / Cursor
 * standards for collapsed AI rails). Do not change without spec update.
 */

import { useCallback } from 'react';
import { useAssistantStore } from '@/lib/stores/assistant-store';
import { SIDEBAR_RAIL_WIDTH } from '@/lib/assistant/types';

interface RailButtonProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function RailButton({ label, active, onClick, children }: RailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        'group relative flex h-10 w-10 items-center justify-center rounded-md',
        'transition-colors duration-200',
        active
          ? 'bg-accent-soft text-accent-ink'
          : 'text-ink-2 hover:bg-bg-elev hover:text-ink',
      ].join(' ')}
    >
      {children}
      {/* Hover tooltip — small, calm, no flash. */}
      <span
        className={[
          'pointer-events-none absolute right-full mr-2 whitespace-nowrap',
          'bg-ink text-bg rounded-sm px-2 py-1 text-xs opacity-0',
          'transition-opacity duration-150 group-hover:opacity-100',
        ].join(' ')}
        role="tooltip"
      >
        {label}
      </span>
    </button>
  );
}

export function AssistantRail() {
  const isExpanded = useAssistantStore((s) => s.isExpanded);
  const mode = useAssistantStore((s) => s.mode);
  const setExpanded = useAssistantStore((s) => s.setExpanded);
  const setMode = useAssistantStore((s) => s.setMode);
  const runningTasks = useAssistantStore((s) => s.runningTasks);
  const activityLog = useAssistantStore((s) => s.activityLog);

  const openChat = useCallback(() => {
    setExpanded(true);
    setMode('chat');
  }, [setExpanded, setMode]);

  const openVoice = useCallback(() => {
    setExpanded(true);
    // Voice activation itself is handled by the composer (it dispatches
    // a voice-store action). Here we just signal the intent in the UI mode.
    setMode('voice');
  }, [setExpanded, setMode]);

  const openCommandPalette = useCallback(() => {
    // Dispatch the same Cmd+K shortcut the existing CommandPalette listens for.
    // It is mounted globally in app/(app)/layout.tsx, so this just toggles it.
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
    );
  }, []);

  const openActivity = useCallback(() => {
    setExpanded(true);
    // The expanded panel renders ActivityTimeline as a secondary tab (U2).
    // We just expand; the user picks the tab.
    setMode('idle');
  }, [setExpanded, setMode]);

  const hasRunningTasks = runningTasks.length > 0;
  const hasActivity = activityLog.length > 0;

  return (
    <aside
      style={{ width: SIDEBAR_RAIL_WIDTH }}
      className={[
        'bg-bg-sunken border-line flex h-full flex-col items-center gap-2 border-l py-3',
        // The rail collapses visually when expanded panel is open: we keep it
        // mounted (state preservation) but hide it behind the expanded panel.
        // The AssistantSidebar parent handles the actual layout transition.
      ].join(' ')}
      aria-label="Asistente Lex (rail colapsado)"
    >
      {/* Voice orb */}
      <RailButton
        label="Hablar con Lex"
        active={mode === 'voice'}
        onClick={openVoice}
      >
        {/* Minimal orb glyph — full reactive orb appears in expanded state. */}
        <span
          className={[
            'block h-5 w-5 rounded-full',
            mode === 'voice'
              ? 'bg-ok animate-hud-pulse'
              : 'bg-accent/70',
          ].join(' ')}
          aria-hidden
        />
      </RailButton>

      {/* Chat */}
      <RailButton
        label="Escribir a Lex"
        active={mode === 'chat' || (isExpanded && mode === 'idle')}
        onClick={openChat}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </RailButton>

      {/* Cmd+K shortcut */}
      <RailButton label="Comandos (⌘K)" onClick={openCommandPalette}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 18v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2M6 9H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </RailButton>

      <div className="bg-line my-1 h-px w-6" aria-hidden />

      {/* Activity timeline indicator */}
      <RailButton label="Actividad reciente" onClick={openActivity}>
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {hasRunningTasks && (
            <span
              className="bg-warn absolute -right-1 -top-1 h-2 w-2 rounded-full"
              aria-label="Tareas en curso"
            />
          )}
          {!hasRunningTasks && hasActivity && (
            <span
              className="bg-accent absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full opacity-70"
              aria-hidden
            />
          )}
        </div>
      </RailButton>
    </aside>
  );
}
