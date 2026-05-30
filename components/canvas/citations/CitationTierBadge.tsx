"use client";

/**
 * Sprint M20.10 · CitationTierBadge
 *
 * Badge visual del 4-tier citation system con tooltip + click para abrir
 * fuente_url oficial. Se usa dentro de NormaCitadaBlock y JurisprudenciaBlock
 * en el Canvas TipTap.
 *
 * Variantes:
 *   - inline (default): badge compacto al lado del texto
 *   - card: badge expandido con descripción completa
 */
import { useState } from "react";
import type { CitationTier } from "@/lib/types/blocks";
import { extractTier, getTierMeta, buildTierTooltip } from "@/lib/citations/tier";

interface CitationTierBadgeProps {
  tier?: CitationTier;
  verified?: boolean;
  derogada?: boolean;
  fuente_url?: string | null;
  fuente_url_oficial?: string | null;
  derogada_por?: string | null;
  suggested_correction?: string | null;
  variant?: "inline" | "card";
  showLabel?: boolean;
  onClick?: () => void;
}

export function CitationTierBadge(props: CitationTierBadgeProps) {
  const {
    variant = "inline",
    showLabel = true,
    onClick,
    ...block
  } = props;
  const [open, setOpen] = useState(false);

  const tier = extractTier(block);
  const meta = getTierMeta(tier);
  const tooltip = buildTierTooltip(block);
  const url = block.fuente_url_oficial ?? block.fuente_url ?? null;

  function handleClick(e: React.MouseEvent) {
    if (onClick) {
      e.preventDefault();
      onClick();
      return;
    }
    if (variant === "card") {
      setOpen((o) => !o);
    }
  }

  const inlineClasses = `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${meta.colorClass} ${meta.bgClass} ${meta.borderClass} cursor-help`;

  if (variant === "inline") {
    return (
      <span
        title={tooltip}
        onClick={handleClick}
        className={inlineClasses}
        data-tier={tier}
        data-citation-badge
      >
        <span aria-hidden>{meta.icon}</span>
        {showLabel && <span>{meta.shortLabel}</span>}
      </span>
    );
  }

  // variant card
  return (
    <div
      className={`inline-block rounded-md border ${meta.borderClass} ${meta.bgClass} p-2 text-xs`}
      data-tier={tier}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-2 font-semibold ${meta.colorClass}`}
      >
        <span aria-hidden>{meta.icon}</span>
        <span>{meta.label}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1 text-[11px] leading-snug">
          <p className="text-slate-700 dark:text-slate-300">{meta.description}</p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block break-all text-blue-700 underline dark:text-blue-400"
            >
              {url}
            </a>
          )}
          {block.derogada_por && (
            <p className="text-red-700 dark:text-red-400">
              Derogada por: <strong>{block.derogada_por}</strong>
            </p>
          )}
          {block.suggested_correction && (
            <p className="text-amber-700 dark:text-amber-400">
              Sugerencia: <em>{block.suggested_correction}</em>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
