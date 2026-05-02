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
      <div className="grid h-screen w-screen grid-cols-[248px_1fr] overflow-hidden bg-bg text-ink">
        {children}
        <div className="pointer-events-none absolute bottom-[22px] left-1/2 z-50 -translate-x-1/2">
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
