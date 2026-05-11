import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { getSessionPrincipal } from '@/lib/supabase/session';

export const dynamic = 'force-dynamic';

export default async function OnboardingWizardPage() {
  const principal = await getSessionPrincipal();
  if (!principal) redirect('/login');
  return <OnboardingWizard />;
}
