/**
 * Public exports for the AssistantSidebar module.
 *
 * Mount AssistantProvider in app/(app)/layout.tsx behind the
 * NEXT_PUBLIC_ASSISTANT_SIDEBAR_ENABLED feature flag. See README.md.
 */

export { AssistantProvider } from './AssistantProvider';
export { AssistantSidebar } from './AssistantSidebar';
export { AssistantRail } from './AssistantRail';
export { AssistantHeader } from './AssistantHeader';
export { AssistantThread } from './AssistantThread';
export { AssistantComposer } from './AssistantComposer';
export { ContextBadge } from './ContextBadge';
export { VoiceOrb } from './VoiceOrb';
export { ActionCard } from './ActionCard';
export { TaskCard } from './TaskCard';
export { ReadyToSendCard } from './ReadyToSendCard';
export type { ReadyToSendData } from './ReadyToSendCard';
export { ActivityTimeline } from './ActivityTimeline';
