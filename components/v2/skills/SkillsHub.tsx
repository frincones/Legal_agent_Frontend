'use client';

/**
 * LexAI UX v2 — SkillsHub
 *
 * Contenedor principal del Skills Hub. Fetcha /api/skills,
 * maneja estados loading/error/vacío y pasa los skills a SkillsGrid.
 *
 * Si el backend no devuelve skills, usa el fallback hardcodeado (mismos 3
 * skills que SidebarSkillsList usa como fallback).
 */

import { useEffect, useState } from 'react';
import { SkillsGrid } from './SkillsGrid';
import type { SkillCardSkill } from './SkillCard';

const FALLBACK_SKILLS: SkillCardSkill[] = [
  {
    id: 'ask',
    name: '/ask',
    path: '/ask',
    description: 'Consulta libre al asistente jurídico de LexAI.',
    category: 'Consultar',
  },
  {
    id: 'lex',
    name: '/lex',
    path: '/lex',
    description: 'Análisis jurídico profundo con fuentes normativas y jurisprudencia.',
    category: 'Analizar',
  },
  {
    id: 'redactar-poder',
    name: '/redactar/poderEspecial',
    path: '/redactar/poderEspecial',
    description: 'Redactar un poder especial con las instrucciones del caso.',
    category: 'Redactar',
  },
];

// Skeleton de carga — 6 tarjetas fantasma
function SkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[200px] rounded-xl animate-pulse"
          style={{ background: 'var(--v2-bg-subtle, #F2F1EC)' }}
        />
      ))}
    </div>
  );
}

export function SkillsHub() {
  const [skills, setSkills] = useState<SkillCardSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/skills', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error ${res.status} al cargar skills`);
      const data = await res.json();

      // Normalizar: puede ser array plano o { skills: [...] }
      const raw: Array<{ id?: string; name?: string; path?: string; description?: string; category?: string }> =
        Array.isArray(data) ? data : (data.skills ?? []);

      const mapped: SkillCardSkill[] = raw
        .filter((s) => s.name || s.path)
        .map((s, i) => ({
          id: s.id ?? s.path ?? String(i),
          name: s.name ?? s.path ?? `Skill ${i + 1}`,
          path: s.path ?? s.name ?? '',
          description: s.description ?? '',
          category: s.category,
        }));

      setSkills(mapped.length > 0 ? mapped : FALLBACK_SKILLS);
    } catch {
      // Fallback silencioso — no bloquea la UI
      setSkills(FALLBACK_SKILLS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <SkeletonGrid />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p
          className="text-[14px]"
          style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
        >
          {error}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg px-4 py-2 text-[13px] font-medium transition-colors"
          style={{
            background: 'var(--v2-brand-navy, #0E2A5E)',
            color: '#ffffff',
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return <SkillsGrid initialSkills={skills} />;
}
