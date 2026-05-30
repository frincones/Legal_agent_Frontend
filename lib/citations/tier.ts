/**
 * Sprint M20.10 · Helpers para 4-tier citation system.
 *
 * Backend emite tier en cada NormaCitadaBlock / JurisprudenciaBlock.
 * Frontend usa estos helpers para color, ícono, label y semánticas Tailwind.
 */
import type { CitationTier } from "@/lib/types/blocks";

export interface TierMeta {
  tier: CitationTier;
  label: string;
  shortLabel: string;
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
  severity: "ok" | "warning" | "critical";
}

export const TIER_META: Record<CitationTier, TierMeta> = {
  GROUNDED: {
    tier: "GROUNDED",
    label: "Verificado contra fuente oficial",
    shortLabel: "verificado",
    icon: "✓",
    colorClass: "text-emerald-700 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    description:
      "La cita fue verificada contra una fuente oficial colombiana (SUIN, Senado, Corte Constitucional, CSJ).",
    severity: "ok",
  },
  VERIFY_FLAG: {
    tier: "VERIFY_FLAG",
    label: "Verificar manualmente",
    shortLabel: "verificar",
    icon: "⚠",
    colorClass: "text-amber-700 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
    borderClass: "border-amber-200 dark:border-amber-800",
    description:
      "La cita viene del conocimiento del modelo y no se pudo verificar contra fuente oficial. Revísala manualmente.",
    severity: "warning",
  },
  DEROGADA: {
    tier: "DEROGADA",
    label: "Norma derogada",
    shortLabel: "DEROGADA",
    icon: "✗",
    colorClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/40",
    borderClass: "border-red-300 dark:border-red-800",
    description:
      "Esta norma fue derogada o modificada. Reemplázala por la norma vigente sugerida.",
    severity: "critical",
  },
  NOT_FOUND: {
    tier: "NOT_FOUND",
    label: "Cita no encontrada",
    shortLabel: "NO EXISTE",
    icon: "⊗",
    colorClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/40",
    borderClass: "border-red-300 dark:border-red-800",
    description:
      "Esta cita no existe en ninguna fuente verificable. Corrígela siguiendo la sugerencia.",
    severity: "critical",
  },
  // M20.13: 5° tier - norma vigente pero modulada por jurisprudencia constitucional
  MODULADA: {
    tier: "MODULADA",
    label: "Norma vigente con modulación constitucional",
    shortLabel: "MODULADA",
    icon: "⚖",
    colorClass: "text-orange-700 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-950/40",
    borderClass: "border-orange-200 dark:border-orange-800",
    description:
      "Esta norma sigue vigente pero su aplicación está modulada por jurisprudencia constitucional (exequibilidad condicionada). Aplícala con las limitaciones indicadas.",
    severity: "warning",
  },
};

/**
 * Extrae tier de un block con compatibilidad backwards:
 *   - tier explícito (M20.10+) → usar directo
 *   - verified=true → GROUNDED
 *   - derogada=true → DEROGADA
 *   - sin flags → VERIFY_FLAG (asume revisión manual)
 */
export function extractTier(block: {
  tier?: CitationTier;
  verified?: boolean;
  derogada?: boolean;
}): CitationTier {
  if (block.tier && ["GROUNDED", "VERIFY_FLAG", "DEROGADA", "NOT_FOUND", "MODULADA"].includes(block.tier)) {
    return block.tier;
  }
  if (block.derogada === true) return "DEROGADA";
  if (block.verified === true) return "GROUNDED";
  return "VERIFY_FLAG";
}

export function getTierMeta(tier: CitationTier): TierMeta {
  return TIER_META[tier] ?? TIER_META.VERIFY_FLAG;
}

/**
 * Helper para construir un texto de tooltip humano-legible incluyendo
 * fuente_url + suggested_correction + derogada_por si presente.
 */
export function buildTierTooltip(block: {
  tier?: CitationTier;
  verified?: boolean;
  derogada?: boolean;
  fuente_url?: string | null;
  fuente_url_oficial?: string | null;
  derogada_por?: string | null;
  suggested_correction?: string | null;
}): string {
  const tier = extractTier(block);
  const meta = getTierMeta(tier);
  const parts: string[] = [meta.label, meta.description];

  const url = block.fuente_url_oficial ?? block.fuente_url;
  if (url) parts.push(`Fuente: ${url}`);
  if (block.derogada_por) parts.push(`Derogada por: ${block.derogada_por}`);
  if (block.suggested_correction) parts.push(`Sugerencia: ${block.suggested_correction}`);

  return parts.join("\n\n");
}
