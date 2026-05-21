import { redirect } from 'next/navigation';
import { getSessionPrincipal } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { VoiceHUD } from '@/components/voice/VoiceHUD';
import { VoiceProvider } from '@/components/voice/VoiceProvider';
import { CommandPalette } from '@/components/command/CommandPalette';
import { CommandPaletteV2 } from '@/components/v2/commandk/CommandPaletteV2';
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

// F1-T08 · UX v2: cuando UX_V2_SHELL=true, se monta CommandPaletteV2 en lugar
// del CommandPalette legacy. Flag OFF → cero cambios.
const UX_V2_SHELL = process.env.NEXT_PUBLIC_UX_V2_SHELL === 'true';

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
      {/* Outer shell · full viewport width. The assistant sidebar is a
          floating overlay on the right edge (no longer pushes the shell)
          to avoid fighting with host pages that have their own right-side
          panels (canvas citations, etc.). */}
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-ink">
        <OfflineIndicator />
        <QuotaBanner />
        {/*
          F1-T07: cuando UX_V2_SHELL=true usamos flex (el sidebar v2 controla
          su propio ancho con framer-motion). Con flag OFF, el grid legacy de
          248px queda intacto — cero regresión.
        */}
        <div
          className={
            UX_V2_SHELL
              ? 'flex min-h-0 flex-1 overflow-hidden'
              : 'grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[248px_1fr]'
          }
        >
        {children}
        <EntitledOnly module="voice_agent" silent>
          <div className="pointer-events-none fixed bottom-[16px] left-1/2 z-50 -translate-x-1/2 md:bottom-[22px]">
            <div className="pointer-events-auto">
              <VoiceHUD />
            </div>
          </div>
        </EntitledOnly>
        {/* F1-T08: Switch CommandPalette → CommandPaletteV2 con flag */}
        {UX_V2_SHELL ? <CommandPaletteV2 /> : <CommandPalette />}
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
