'use client';

/**
 * LexAI UX v2 — SkillsGrid
 *
 * Grid filtrable de skills. Filtra client-side sobre initialSkills.
 * Filtros: búsqueda por nombre/descripción + categoría.
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { SkillCard, type SkillCardSkill } from './SkillCard';

interface SkillsGridProps {
  initialSkills: SkillCardSkill[];
}

const ALL_CATEGORY = 'Todas';

export function SkillsGrid({ initialSkills }: SkillsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  // Categorías únicas extraídas de los skills
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const s of initialSkills) {
      if (s.category) cats.add(s.category);
    }
    return [ALL_CATEGORY, ...Array.from(cats).sort()];
  }, [initialSkills]);

  // Filtrado combinado
  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialSkills.filter((s) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORY || s.category === selectedCategory;
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q) ||
        s.path.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [initialSkills, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col gap-5">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        <div
          className="relative flex items-center rounded-lg border"
          style={{ borderColor: 'var(--v2-border-subtle, #E8E7E1)' }}
        >
          <Search
            size={14}
            className="absolute left-3"
            style={{ color: 'var(--v2-text-tertiary, #807E76)' }}
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Buscar skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-lg bg-transparent pl-9 pr-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-navy,#0E2A5E)] focus:ring-offset-1"
            style={{
              color: 'var(--v2-text-primary, #1A1916)',
              minWidth: '200px',
            }}
          />
        </div>

        {/* Selector de categoría */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-9 rounded-lg border bg-transparent px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-navy,#0E2A5E)] focus:ring-offset-1 cursor-pointer"
          style={{
            borderColor: 'var(--v2-border-subtle, #E8E7E1)',
            color: 'var(--v2-text-primary, #1A1916)',
          }}
          aria-label="Filtrar por categoría"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Resultados */}
      {filteredSkills.length === 0 ? (
        <p
          className="py-10 text-center text-[14px]"
          style={{ color: 'var(--v2-text-secondary, #4A4944)' }}
        >
          No se encontraron skills con los filtros seleccionados.
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
