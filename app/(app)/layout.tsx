import { redirect } from 'next/navigation';
import { getSessionPrincipal } from '@/lib/supabase/session';
import { VoiceHUD } from '@/components/voice/VoiceHUD';
import { VoiceProvider } from '@/components/voice/VoiceProvider';
import { CommandPalette } from '@/components/command/CommandPalette';
import { HITLController } from '@/components/hitl/HITLController';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Fast: reads cookie + decodes JWT locally · no Supabase roundtrip.
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');

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
