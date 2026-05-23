"use client";

import * as React from "react";

export interface TemplateListItem {
  id: string;
  nombre: string;
  jurisdiccion: string;
  materia: string;
  description: string;
  sections_count: number;
}

interface Props {
  value: string;
  onChange: (id: string, item: TemplateListItem | null) => void;
  items: TemplateListItem[];
  loading?: boolean;
}

const JURISDICCION_LABELS: Record<string, string> = {
  laboral: "Laboral",
  civil: "Civil",
  penal: "Penal",
  constitucional: "Constitucional",
  administrativo: "Administrativo",
  familia: "Familia",
  tributario: "Tributario",
  comercial: "Comercial",
  general: "General",
};

export function TemplateSelector({ value, onChange, items, loading }: Props) {
  // Agrupar por jurisdicción
  const grouped = React.useMemo(() => {
    const map = new Map<string, TemplateListItem[]>();
    for (const it of items) {
      const j = it.jurisdiccion || "general";
      if (!map.has(j)) map.set(j, []);
      map.get(j)!.push(it);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <div>
      <label className="text-xs font-medium text-zinc-700">Tipo de documento</label>
      <select
        value={value}
        onChange={(e) => {
          const id = e.target.value;
          const item = items.find((x) => x.id === id) || null;
          onChange(id, item);
        }}
        disabled={loading}
        className="w-full mt-1 text-sm border border-zinc-300 rounded px-2 py-1.5 disabled:opacity-60"
      >
        <option value="">{loading ? "Cargando…" : "Auto-detectar desde intent"}</option>
        {grouped.map(([jur, list]) => (
          <optgroup key={jur} label={JURISDICCION_LABELS[jur] || jur}>
            {list.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({t.sections_count} secciones)
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
