# AssistantSidebar · Lex

Right-side AI sidebar that unifies voice and chat for LexAI. Built on top of
the existing `VoiceProvider`, `CommandPalette`, and `/v1/skills/*` backend.

> **Status: Sprints 1–3 complete.** Sidebar shell, real backend wiring,
> multi-agent generator integration, voice unified, responsive (push /
> overlay / bottom-sheet), resize, activity timeline, action / task /
> ready-to-send cards.
> **Sprint 4 pending:** seed checklists, eval suite, admin curator UI,
> proactive nudges, firm playbook editor, E2E + metrics.

## Activation

The sidebar is **opt-in via feature flag**, isolated from production until
you flip the flag.

### 1. Enable in env

Add to `.env.local`:

```
NEXT_PUBLIC_ASSISTANT_SIDEBAR_ENABLED=true
```

(Default = off. Removing the flag makes the sidebar disappear with zero
side effects.)

### 2. Mount in `app/(app)/layout.tsx`

Inside `<VoiceProvider>`, after the existing children, add **one** line near
the other globals (`<CommandPalette />`, `<HITLController />`):

```tsx
import { AssistantProvider } from '@/components/assistant';

const assistantEnabled = process.env.NEXT_PUBLIC_ASSISTANT_SIDEBAR_ENABLED === 'true';

// inside JSX:
{assistantEnabled && <AssistantProvider />}
```

That single mount adds the rail at the right edge and handles all
responsive variants (push ≥1280px desktop, overlay 768–1280, bottom-sheet
+ floating orb <768).

### 3. Apply the backend migration (one-time)

Before the multi-agent generator can persist runs, apply:

```
storage/schemas/2026_05_24_templates_specialization.sql
```

See `backend/docs/IMPLEMENTATION_PLAN_TEMPLATES.md` for full steps.

## File map

| File | Purpose |
|---|---|
| `AssistantProvider.tsx` | Mounts sidebar, hydrates prefs, syncs page context. |
| `AssistantSidebar.tsx` | Orchestrator · viewport-aware (push/overlay/bottom-sheet) · resize drag. |
| `AssistantRail.tsx` | Collapsed 56px state. |
| `AssistantHeader.tsx` | VoiceOrb + status + ContextBadge + close. |
| `AssistantComposer.tsx` | Unified text + mic input + slash hint. |
| `AssistantThread.tsx` | Unified voice + chat transcript with citation chips. |
| `ContextBadge.tsx` | "Where is the agent" indicator. |
| `VoiceOrb.tsx` | Animated voice state indicator (3 sizes). |
| `ActionCard.tsx` | Inline suggested action with approval gates. |
| `TaskCard.tsx` | Background task progress (e.g. multi-agent generation). |
| `ReadyToSendCard.tsx` | HITL gate after multi-agent · score + issues + assumptions. |
| `ActivityTimeline.tsx` | Collapsible "what I did" tab (U2). |
| `lib/assistant/types.ts` | All shared types. |
| `lib/assistant/context-detector.ts` | Pure pathname → PageContext. |
| `lib/assistant/skill-runner.ts` | SSE client for `/api/skills/execute/stream`. |
| `lib/assistant/multi-agent-runner.ts` | SSE client for `/api/multi-agent/generate/stream`. |
| `lib/stores/assistant-store.ts` | Zustand store + localStorage prefs. |

## Architecture

```
<AssistantProvider>
 ├─ hydratePrefs() once on mount
 ├─ usePathname() → detectContext → store.setContext
 └─ <AssistantSidebar>
     ├─ viewport detector (push / overlay / bottom-sheet)
     ├─ if expanded:
     │   ├─ resize handle (drag · persists width)
     │   ├─ <AssistantHeader onVoiceToggle={voice.toggle} />
     │   ├─ <AssistantThread />
     │   ├─ <ActivityTimeline />
     │   └─ <AssistantComposer onSend={handleSend} onVoiceToggle={...} />
     └─ <AssistantRail /> (always rendered on desktop / tablet)
          (floating <VoiceOrb size='lg'> on mobile when collapsed)
```

State lives in `lib/stores/assistant-store.ts` (Zustand) and mirrors
preferences to localStorage under `lexai.assistant.prefs.v1`.

## What works end-to-end (Sprints 1–3)

| Capability | Status |
|---|---|
| Right-side rail (4 entry points) | ✓ |
| Expanded panel with header / thread / timeline / composer | ✓ |
| Context badge (matter / list / global) | ✓ |
| Page-aware tool scope hint to backend (matter_id auto) | ✓ |
| Cmd+K via existing CommandPalette (untouched) | ✓ |
| `/` command sent to `/api/skills/execute/stream` | ✓ |
| Plain text → `/ask` skill (returns helpful error if not seeded) | ✓ |
| SSE delta-by-delta streaming into the thread (no flicker) | ✓ |
| Citations with verified/pending/derogated badges | ✓ |
| Voice mic toggle uses existing `VoiceProvider.toggle()` | ✓ |
| VoiceOrb reflects voice-store state (listening/thinking/speaking) | ✓ |
| Multi-agent stream (`/api/multi-agent/generate/stream`) ready to consume | ✓ |
| ActionCard / TaskCard / ReadyToSendCard components | ✓ |
| ActivityTimeline (U2) | ✓ |
| Resize drag with localStorage persist (U8) | ✓ |
| Responsive · push / overlay / bottom-sheet (U1) | ✓ |
| Floating orb persistent mobile (U3) | ✓ |

## What's NOT here yet (Sprint 4)

- ❌ Action cards / task cards / ready-to-send wired into a live flow.
  The components are ready; Sprint 4 wires `GenerateWritDialog` to dispatch
  `runMultiAgent` and feed the cards into the thread.
- ❌ Activity timeline hydrating from the backend (`skill_executions`).
- ❌ Onboarding tooltip (U5).
- ❌ Proactive nudges with anti-friction.
- ❌ Cross-matter scope auto-detection.
- ❌ Firm playbook editor at `/settings/firm/profile`.
- ❌ E2E Playwright suite.

## Safety guarantees

1. **No existing component / route modified.** Sidebar mounts via one
   new line in `layout.tsx` (added by the operator when ready).
2. **Feature flag isolation.** With `NEXT_PUBLIC_ASSISTANT_SIDEBAR_ENABLED`
   unset or `false`, nothing changes.
3. **Backend additive.** All new endpoints
   (`/v1/templates/search`, `/v1/templates/system/by-id/:id`,
   `/v1/multi-agent/generate`, `/v1/multi-agent/generate/stream`) are NEW.
   Existing `/v1/skills/*` and `/v1/canvas/generate` continue working
   unchanged.
4. **VoiceProvider untouched.** The sidebar consumes `useVoice()` as a
   client; no modifications to `RealtimeClient` or `voice-store`.
5. **CanvasEditor / TipTap untouched.** The sidebar pushes layout via
   `--lexai-assistant-pad-right` only on push viewport; canvas remains
   the source of truth for documents.
6. **Hydration-safe.** Prefs only apply after `prefsHydrated=true`.
7. **Reversible.** Roll back by removing the env flag or the
   single `<AssistantProvider />` line.

## Manual smoke test (Sprints 1–3)

After enabling the flag and mounting the provider:

1. Visit any `/casos/[id]` → rail visible right edge.
2. Click chat icon → panel opens, ContextBadge shows matter.
3. Type "¿cuál es el plazo de contestación?" → SSE response streams.
4. Type `/redactar-demanda-laboral algo` → skill executes (or 404 with hint).
5. Click mic icon in composer → voice connects (granted permission once),
   VoiceOrb pulses green.
6. Resize sidebar by dragging left edge → width persists per user.
7. Open activity tab → recent messages appear.
8. Resize browser <1280px → sidebar becomes overlay.
9. Resize browser <768px → sidebar becomes bottom sheet, floating orb shows
   when collapsed.
10. Toggle flag off → everything disappears, no artifact.
