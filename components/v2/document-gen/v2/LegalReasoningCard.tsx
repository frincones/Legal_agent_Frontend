"use client";

/**
 * M19.24.B.7 — Legal Reasoning Card
 *
 * Card que muestra el análisis legal previo del agente (Paso 3 de Claude):
 * régimen aplicable, naturaleza del acto, fundamento normativo, premisas
 * corregidas (e.g. Art. 836 CGP no existe) y advertencias de riesgo.
 *
 * Se renderiza en el chat panel del IntegratedGenerationCanvas cuando
 * el backend emite el evento SSE legal_classification.
 */

import * as React from "react";
import type { LegalClassificationData } from "@/lib/types/blocks";

interface Props {
  classification: LegalClassificationData;
  collapsible?: boolean;
}

const FAMILY_LABELS: Record<string, string> = {
  judicial_demanda: "Demanda judicial",
  judicial_recurso: "Recurso judicial",
  judicial_memorial: "Memorial procesal",
  judicial_constitucional: "Acción constitucional",
  judicial_solicitud: "Solicitud judicial",
  criminal_denuncia: "Denuncia penal",
  notarial_poder: "Poder notarial",
  notarial_escritura: "Escritura pública",
  notarial_extrajuicio: "Declaración extrajuicio",
  notarial_acta: "Acta notarial",
  contractual_civil: "Contrato civil",
  contractual_mercantil: "Contrato mercantil",
  contractual_laboral: "Contrato laboral",
  contractual_corporate: "Contrato corporativo",
  corporate_estatutos: "Estatutos societarios",
  corporate_acta: "Acta corporativa",
  corporate_policy: "Política corporativa",
  petitorio_admin: "Derecho de petición",
  petitorio_pqrs: "PQRS",
  petitorio_extrajudicial: "Requerimiento extrajudicial",
  tributario_dian: "Documento tributario",
  conceptual: "Concepto jurídico",
  sucesional: "Documento sucesional",
};

const REGIMEN_LABELS: Record<string, string> = {
  procesal_judicial: "Procesal judicial",
  sustantivo_civil: "Sustantivo civil (CC)",
  sustantivo_mercantil: "Sustantivo mercantil (CCo)",
  notarial_extrajudicial: "Notarial extrajudicial",
  administrativo_publico: "Administrativo público (CPACA)",
  tributario_dian: "Tributario (DIAN)",
  penal_acusatorio: "Penal acusatorio",
  laboral_sustantivo: "Laboral sustantivo (CST)",
  constitucional: "Constitucional",
};

const NATURALEZA_LABELS: Record<string, string> = {
  declarativo: "Declarativo",
  de_disposicion: "De disposición",
  de_administracion: "De administración",
  de_garantia: "De garantía",
  de_mandato: "De mandato",
  petitorio: "Petitorio",
  informativo: "Informativo",
  constitutivo: "Constitutivo",
  de_compromiso: "De compromiso",
  extintivo: "Extintivo",
};

export function LegalReasoningCard({ classification, collapsible = false }: Props) {
  const [expanded, setExpanded] = React.useState(!collapsible);

  if (classification.skipped) return null;

  const hasCorrections = classification.premisas_corregidas.length > 0;
  const hasRisks = classification.advertencias_riesgo.length > 0;
  const hasContent =
    hasCorrections ||
    hasRisks ||
    classification.fundamento_normativo.length > 0 ||
    classification.reasoning;

  if (!hasContent) return null;

  const familyLabel = FAMILY_LABELS[classification.document_family] || classification.document_family;
  const regimenLabel = classification.regimen_aplicable
    ? REGIMEN_LABELS[classification.regimen_aplicable] || classification.regimen_aplicable
    : null;
  const naturalezaLabel = classification.naturaleza_acto
    ? NATURALEZA_LABELS[classification.naturaleza_acto] || classification.naturaleza_acto
    : null;

  return (
    <div className="mx-3 my-2 border-2 border-indigo-200 bg-indigo-50/50 rounded-md overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => collapsible && setExpanded((e) => !e)}
        className={`w-full flex items-center justify-between px-3 py-2 ${collapsible ? "hover:bg-indigo-100/50 cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[15px]">🧠</span>
          <span className="text-[12px] font-semibold text-indigo-900">
            Análisis legal previo
          </span>
          <span className="text-[10px] text-indigo-600 font-medium">
            {familyLabel}
          </span>
        </div>
        {collapsible && (
          <span className="text-[10px] text-indigo-500">{expanded ? "▾" : "▸"}</span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-indigo-200 px-3 py-2.5 bg-white space-y-2.5">
          {/* Régimen + Naturaleza */}
          {(regimenLabel || naturalezaLabel) && (
            <div className="flex flex-wrap gap-2 text-[10.5px]">
              {regimenLabel && (
                <div className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded">
                  <span className="opacity-60">Régimen:</span> <strong>{regimenLabel}</strong>
                </div>
              )}
              {naturalezaLabel && (
                <div className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded">
                  <span className="opacity-60">Naturaleza:</span> <strong>{naturalezaLabel}</strong>
                </div>
              )}
            </div>
          )}

          {/* Fundamento normativo */}
          {classification.fundamento_normativo.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase text-zinc-600 mb-1">
                Fundamento normativo aplicable
              </div>
              <div className="text-[11.5px] text-zinc-800 leading-snug">
                {classification.fundamento_normativo.join(" · ")}
              </div>
            </div>
          )}

          {/* Premisas corregidas */}
          {hasCorrections && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold uppercase text-red-700">
                Correcciones de fundamento ({classification.premisas_corregidas.length})
              </div>
              {classification.premisas_corregidas.map((p, i) => (
                <div
                  key={i}
                  className="border border-red-200 bg-red-50 rounded p-2 text-[11px] space-y-0.5"
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-red-700">⚠</span>
                    <span className="text-zinc-600">Citaste:</span>
                    <span className="font-mono text-[10.5px] bg-white px-1 rounded border border-red-200">
                      {p.usuario_dijo}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-emerald-700">✓</span>
                    <span className="text-zinc-600">Correcto:</span>
                    <strong className="text-zinc-900">{p.correcto}</strong>
                  </div>
                  {p.razon && (
                    <div className="text-[10.5px] text-zinc-600 italic pt-0.5 leading-snug">
                      {p.razon}
                    </div>
                  )}
                  {p.fuente && (
                    <a
                      href={p.fuente}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      Ver fuente →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Advertencias de riesgo */}
          {hasRisks && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase text-amber-700">
                Advertencias de riesgo ({classification.advertencias_riesgo.length})
              </div>
              <ul className="space-y-1">
                {classification.advertencias_riesgo.map((adv, i) => (
                  <li key={i} className="text-[11px] text-zinc-800 flex gap-1.5">
                    <span className="text-amber-700 flex-shrink-0">⚠</span>
                    <span className="leading-snug">{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasoning */}
          {classification.reasoning && (
            <div className="text-[10.5px] italic text-zinc-500 pt-1 border-t border-zinc-100 leading-snug">
              {classification.reasoning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
