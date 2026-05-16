'use client';

import { redirect } from 'next/navigation';

export default function NewSkillPage() {
  // Redirige al editor genérico con id='new'
  if (typeof window !== 'undefined') {
    window.location.replace('/saas/skills/new/editor');
  }
  return null;
}
