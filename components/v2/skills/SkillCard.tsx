'use client';

/**
 * LexAI UX v2 — SkillCard
 *
 * Tarjeta individual de skill para el Skills Hub.
 * Al hacer click en "Usar skill" navega a /inicio con query params
 * para pre-rellenar el compositor.
 */

import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface SkillCardSkill {
  id: string;
  name: string;
  path: string;
  description?: string;
  category?: string;
}

interface SkillCardProps {
  skill: SkillCardSkill;
}

export function SkillCard({ skill }: SkillCardProps) {
  const router = useRouter();

  const handleUse = () => {
    const params = new URLSearchParams({
      skill: skill.path,
      prompt: skill.description ?? '',
    });
    // Usamos /v2/inicio directo para no perder query params en el redirect server.
    router.push(`/v2/inicio?${params.toString()}`);
  };

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-5"
      style={{
        borderColor: 'var(--v2-border-subtle, #E8E7E1)',
        background: 'var(--v2-bg-base, #FAFAF7)',
      }}
    >
      {/* Icono */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ background: 'var(--v2-brand-navy-soft, #E8EDF7)' }}
      >
        <Sparkles
          size={18}
          style={{ color: 'var(--v2-brand-navy, #0E2A5E)' }}
          aria-hidden="true"
        />
      </div>

      {/* Nombre */}
      <div>
        <p
          className="text-[13px] font-semibold leading-none"
          style={{ color: 'var(--v2-text-primary, #1A1916)' }}
        >
          {skill.name}
        </p>
        {skill.category && (
          <p
            className="mt-0.5 text-[11px]"
            style={{ color: 'var(--v2-text-tertiary, #807E76)' }}
          >
            {skill.category}
          </p>
        )}
      </div>

      {/* Descripción */}
      {skill.description && (
        <p
          className="flex-1 text-[13px] leading-snug line-clamp-3"
          style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
        >
          {skill.description}
        </p>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={handleUse}
        className="mt-auto w-full rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          background: 'var(--v2-brand-navy, #0E2A5E)',
          color: '#ffffff',
          outlineColor: 'var(--v2-brand-navy, #0E2A5E)',
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--v2-brand-navy-hover, #0a2049)';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--v2-brand-navy, #0E2A5E)';
        }}
      >
        Usar skill
      </button>
    </div>
  );
}
