import { redirect } from 'next/navigation';
import { fetchMatters } from '@/lib/api/rsc-fetchers';

/** Live Canvas landing · redirects to the most recent active matter's canvas.
 *  If the user has no matters, push them to the matter creation flow. */
export default async function CanvasLandingPage() {
  const matters = await fetchMatters({ limit: 1 });
  if (matters.length === 0) {
    redirect('/casos/nuevo');
  }
  redirect(`/casos/${matters[0]!.id}/canvas`);
}
