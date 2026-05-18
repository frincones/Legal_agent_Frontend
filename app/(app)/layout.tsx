import { redirect } from 'next/navigation';
import { getSessionPrincipal } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { VoiceHUD } from '@/components/voice/VoiceHUD';
import { VoiceProvider } from '@/components/voice/VoiceProvider';
import { CommandPalette } from '@/components/command/CommandPalette';
import { HITLController } from '@/components/hitl/HITLController';
import { QuotaBanner } from '@/components/billing/QuotaBanner';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { QuotaErrorWatcher } from '@/components/billing/QuotaErrorWatcher';
import { OfflineIndicator } from '@/components/shell/OfflineIndicator';
import { PWAInstallPrompt } from '@/components/shell/PWAInstallPrompt';
import { MobileBottomNav } from '@/components/shell/MobileBottomNav';
import { EntitlementsProvider } from '@/lib/entitlements/EntitlementsContext';
import { EntitledOnly } from '@/components/entitlements/EntitledOnly';
import { ActivationChecklist } from '@/components/onboarding/ActivationChecklist';
import { LexHelper } from '@/components/onboarding/LexHelper';
import { WelcomeBanner } from '@/components/onboarding/WelcomeBanner';
import { AssistantProvider } from '@/components/assistant';

// Feature flag · sidebar derecho voz+chat unificado (Sprints 1-3).
// When unset or 'false', AssistantProvider is not mounted and nothing changes
// in the layout. When 'true', the right rail appears with chat + voice + ⌘K +
// activity entries; the existing VoiceHUD at the bottom continues working.
const ASSISTANT_SIDEBAR_ENABLED =
  process.env.NEXT_PUBLIC_ASSISTANT_SIDEBAR_ENABLED === 'true';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fast: reads cookie + decodes JWT locally · no Supabase roundtrip.
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');

  // Onboarding gate: if the user hasn't completed the wizard
  // (modo_ejercicio is null) and is hitting a protected route,
  // bounce them to /wizard. The query is cheap (PK lookup) and
  // RLS-scoped to the user's own row.
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('modo_ejercicio')
    .eq('id', principal.user_id)
    .maybeSingle();
  if (profile && !profile.modo_ejercicio) {
    redirect('/wizard');
  }

  return (
    <EntitlementsProvider>
    <VoiceProvider>
      {/* Outer shell · respects --lexai-assistant-pad-right (set by AssistantSidebar
          when expanded on desktop ≥1280px) so the host layout reflows instead
          of being covered. When the flag is off or the sidebar is collapsed,
          the var resolves to 0 / 56px and the shell renders at full width. */}
      <div
        className="flex h-screen flex-col overflow-hidden bg-bg text-ink transition-[width] duration-200 ease-out"
        style={{ width: 'calc(100vw - var(--lexai-assistant-pad-right, 0px))' }}
      >
        <OfflineIndicator />
        <QuotaBanner />
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[248px_1fr]">
        {children}
        <EntitledOnly module="voice_agent" silent>
          <div className="pointer-events-none fixed bottom-[16px] left-1/2 z-50 -translate-x-1/2 md:bottom-[22px]">
            <div className="pointer-events-auto">
              <VoiceHUD />
            </div>
          </div>
        </EntitledOnly>
        <CommandPalette />
        <HITLController />
        </div>
        {ASSISTANT_SIDEBAR_ENABLED && <AssistantProvider />}
        <MobileBottomNav />
        <PWAInstallPrompt />
        <UpgradeModal />
        <QuotaErrorWatcher />
        <ActivationChecklist />
        <LexHelper />
      </div>
    </VoiceProvider>
    </EntitlementsProvider>
  );
}
