"use client";

import * as React from "react";

interface SectionPlanItem {
  key: string;
  title: string;
  order: number;
  roman?: string | null;
  required?: boolean;
  section_instruction?: string | null;
}

interface DetailProfile {
  min_hechos: number;
  min_pretensiones: number;
  jurisprudencia_min: number;
  normas_min: number;
  require_silogismo: boolean;
  require_calculos: boolean;
  require_juramento: boolean;
  require_table_resumen: boolean;
}

export interface TemplatePreviewData {
  id: string;
  nombre: string;
  jurisdiccion: string;
  description: string;
  sections_plan: SectionPlanItem[];
  detail_profile: DetailProfile;
  hunters: Array<{ query: string; hunter: string; top_k: number }>;
  required_data: Record<string, string>;
  calculadora?: string | null;
}

interface Props {
  template: TemplatePreviewData | null;
}

export function TemplatePreview({ template }: Props) {
  if (!template) return null;

  return (
    <div className="border border-zinc-200 rounded-md bg-zinc-50 p-3 text-xs space-y-2">
      <div className="font-semibold text-sm">{template.nombre}</div>
      <p className="text-zinc-600">{template.description}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Metric label="Secciones" value={String(template.sections_plan.length)} />
        <Metric label="Hechos mín." value={String(template.detail_profile.min_hechos)} />
        <Metric label="Pretensiones mín." value={String(template.detail_profile.min_pretensiones)} />
        <Metric label="Jurisp. mín." value={String(template.detail_profile.jurisprudencia_min)} />
      </div>

      <div className="flex flex-wrap gap-1">
        {template.detail_profile.require_silogismo && <Chip label="Silogismo" />}
        {template.detail_profile.require_calculos && <Chip label="Cálculos" />}
        {template.detail_profile.require_juramento && <Chip label="Juramento" />}
        {template.detail_profile.require_table_resumen && <Chip label="Tabla resumen" />}
        {template.calculadora && <Chip label={`Calc: ${template.calculadora.split(":").pop()}`} variant="indigo" />}
      </div>

      <details>
        <summary className="cursor-pointer text-zinc-700 hover:text-zinc-900 select-none">
          Plan de {template.sections_plan.length} secciones
        </summary>
        <ol className="mt-2 space-y-0.5 pl-3">
          {template.sections_plan.map((s) => (
            <li key={s.key} className="text-zinc-700">
              <span className="text-zinc-400">{s.order}.</span>{" "}
              {s.roman && <span className="font-mono">{s.roman}.</span>} {s.title}
            </li>
          ))}
        </ol>
      </details>

      <details>
        <summary className="cursor-pointer text-zinc-700 hover:text-zinc-900 select-none">
          {template.hunters.length} hunters de jurisprudencia
        </summary>
        <ul className="mt-2 space-y-1 pl-3">
          {template.hunters.map((h, i) => (
            <li key={i} className="text-zinc-700 italic">"{h.query}" <span className="text-zinc-400">→ {h.hunter}</span></li>
          ))}
        </ul>
      </details>

      <details>
        <summary className="cursor-pointer text-zinc-700 hover:text-zinc-900 select-none">
          {Object.keys(template.required_data).length} campos requeridos del brief
        </summary>
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 pl-3">
          {Object.entries(template.required_data).map(([k, v]) => (
            <li key={k} className="text-zinc-700">
              <code className="text-[10px]">{k}</code>: <span className="text-zinc-500">{v}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded px-2 py-1">
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="font-bold text-sm text-zinc-800">{value}</div>
    </div>
  );
}

function Chip({ label, variant = "zinc" }: { label: string; variant?: "zinc" | "indigo" }) {
  const cls = variant === "indigo"
    ? "bg-indigo-100 text-indigo-800"
    : "bg-zinc-200 text-zinc-700";
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${cls}`}>
      {label}
    </span>
  );
}
