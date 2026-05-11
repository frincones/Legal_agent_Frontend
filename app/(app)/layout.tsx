import { redirect } from 'next/navigation';
import { getSessionPrincipal } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { VoiceHUD } from '@/components/voice/VoiceHUD';
import { VoiceProvider } from '@/components/voice/VoiceProvider';
import { CommandPalette } from '@/components/command/CommandPalette';
import { HITLController } from '@/components/hitl/HITLController';

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
    <VoiceProvider>
      <div className="grid h-screen w-screen grid-cols-1 overflow-hidden bg-bg text-ink md:grid-cols-[248px_1fr]">
        {children}
        <div className="pointer-events-none fixed bottom-[16px] left-1/2 z-50 -translate-x-1/2 md:bottom-[22px]">
          <div className="pointer-events-auto">
            <VoiceHUD />
          </div>
        </div>
        <CommandPalette />
        <HITLController />
      </div>
    </VoiceProvider>
  );
}
