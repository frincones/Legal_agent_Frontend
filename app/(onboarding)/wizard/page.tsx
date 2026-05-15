import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { JoinOrCreateFirm } from '@/components/onboarding/JoinOrCreateFirm';
import { getSessionPrincipal } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function OnboardingWizardPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');

  // Verificar si el user ya tiene firm asignada
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('firm_id, modo_ejercicio, full_name')
    .eq('id', principal.user_id)
    .maybeSingle();

  // Si ya completó modo_ejercicio Y tiene firm → ya pasó el wizard
  if (profile?.firm_id && profile?.modo_ejercicio) {
    redirect('/inicio');
  }

  // Si NO tiene firm → debe elegir crear-firm o unirse con código (paso OAuth bridge)
  if (!profile?.firm_id) {
    return <JoinOrCreateFirm userName={profile?.full_name || principal.email || ''} />;
  }

  // Tiene firm pero falta modo_ejercicio → wizard tradicional
  return <OnboardingWizard />;
}
