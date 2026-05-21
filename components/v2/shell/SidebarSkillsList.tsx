'use client';

/**
 * F1-T04 · LexAI UX v2 — SidebarSkillsList
 *
 * Lista de skills del firm cargadas desde /api/skills.
 * En colapsado, oculta toda la sección.
 *
 * Cada skill al hacer click abre el composer con el skill prefilled
 * (dispara evento global 'v2:skill-select' con el path del skill).
 *
 * TODO: cuando exista el endpoint /v1/skills/list con firma oficial,
 * reemplazar el fetch a /api/skills por ese endpoint.
 */
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { SidebarItemV2 } from './SidebarItemV2';

interface Skill {
  id: string;
  name: string;
  path: string;
  description?: string;
}

// Stub hardcodeado como fallback cuando el endpoint no devuelve skills.
// TODO: eliminar cuando el backend tenga /v1/skills poblado por firma.
const FALLBACK_SKILLS: Skill[] = [
  { id: 'ask',              name: '/ask',              path: '/ask',              description: 'Consulta libre al asistente' },
  { id: 'lex',              name: '/lex',              path: '/lex',              description: 'Análisis jurídico profundo' },
  { id: 'redactar-poder',   name: '/redactar/poderEspecial', path: '/redactar/poderEspecial', description: 'Redactar poder especial' },
];

interface SidebarSkillsListProps {
  collapsed?: boolean;
}

export function SidebarSkillsList({ collapsed = false }: SidebarSkillsListProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/skills', { cache: 'no-store' });
        if (!res.ok) throw new Error('skills unavailable');
        const data = await res.json();

        // El backend devuelve un array de objetos con name/path/description.
        // Normalizar a la forma esperada.
        const raw: Array<{ id?: string; name?: string; path?: string; description?: string }> =
          Array.isArray(data) ? data : (data.skills ?? []);

        const mapped: Skill[] = raw
          .filter((s) => s.name || s.path)
          .map((s, i) => ({
            id: s.id ?? s.path ?? String(i),
            name: s.name ?? s.path ?? `Skill ${i + 1}`,
            path: s.path ?? s.name ?? '',
            description: s.description ?? '',
          }));

        if (!cancelled) setSkills(mapped.length > 0 ? mapped : FALLBACK_SKILLS);
      } catch {
        if (!cancelled) setSkills(FALLBACK_SKILLS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // En colapsado, ocultar
  if (collapsed) return null;

  const handleSkillClick = (skill: Skill) => {
    // Emite un evento global que el Composer puede escuchar para pre-completarse.
    window.dispatchEvent(
      new CustomEvent('v2:skill-select', { detail: { path: skill.path, name: skill.name } }),
    );
    toast.info(`Skill seleccionada: ${skill.name}`);
  };

  if (loading) {
    return (
      <div className="px-2 py-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="mb-1 h-8 rounded-lg bg-[var(--v2-bg-subtle,#F2F1EC)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-px overflow-y-auto max-h-[200px]">
      {skills.map((skill) => (
        <SidebarItemV2
          key={skill.id}
          icon={Sparkles}
          label={skill.name}
          collapsed={false}
          onClick={() => handleSkillClick(skill)}
        />
      ))}
    </div>
  );
}
