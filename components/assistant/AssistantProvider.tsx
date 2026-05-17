'use client';

/**
 * AssistantProvider — top-level mount for the assistant subsystem.
 *
 * Responsibilities (intentionally small):
 *   1. Hydrate persisted preferences from localStorage once on mount.
 *   2. Detect the current page context (route → PageContext) and feed the store.
 *   3. Render <AssistantSidebar/> as a child.
 *
 * NOT responsible for:
 *   - Voice connection (handled by the existing VoiceProvider higher in the tree).
 *   - Network calls (each interaction triggers its own fetch from inside components).
 *   - Layout shift (the sidebar handles its own push/overlay behavior).
 *
 * Mounting: place this BELOW the existing <VoiceProvider/> in app/(app)/layout.tsx
 * behind the NEXT_PUBLIC_ASSISTANT_SIDEBAR_ENABLED flag. See README.md.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { useAssistantStore } from '@/lib/stores/assistant-store';
import { contextChanged, detectContext } from '@/lib/assistant/context-detector';

import { AssistantSidebar } from './AssistantSidebar';

interface AssistantProviderProps {
  /** Children pass-through so we can wrap freely; usually empty. */
  children?: ReactNode;
}

export function AssistantProvider({ children }: AssistantProviderProps) {
  const pathname = usePathname();
  const hydratePrefs = useAssistantStore((s) => s.hydratePrefs);
  const setContext = useAssistantStore((s) => s.setContext);
  const lastContextRef = useRef<ReturnType<typeof detectContext> | null>(null);

  // Hydrate once on mount.
  useEffect(() => {
    hydratePrefs();
  }, [hydratePrefs]);

  // Re-detect context on every pathname change.
  useEffect(() => {
    if (!pathname) return;
    const next = detectContext(pathname);
    if (contextChanged(lastContextRef.current, next)) {
      lastContextRef.current = next;
      setContext(next);
    }
  }, [pathname, setContext]);

  return (
    <>
      {children}
      <AssistantSidebar />
    </>
  );
}
