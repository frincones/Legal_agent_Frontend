'use client';

/**
 * Pre-flight validator (frontend-side composer).
 *
 * Composes the existing /api/citations/verify endpoint into a
 * higher-level "is this document ready to present?" report.
 *
 * Phase 0 design: pure browser composition. Phase 1 will replace this
 * with a backend /v1/canvas/validate that adds court-formal-rule
 * checks (suma, partes, personería jurídica), inconsistency detection,
 * and applicability checking.
 */

import { extractCitations, type ExtractedCitation } from '@/lib/citations/extract';
import { mapBackendStatus, type CitationStatus } from '@/components/legal/CitationBadge';

export type PreflightSeverity = 'high' | 'medium' | 'info';

export type PreflightIssue = {
  type:
    | 'outdated_citation'
    | 'unverifiable_citation'
    | 'pending_citation'
    | 'empty_document'
    | 'no_citations';
  severity: PreflightSeverity;
  ref?: string;
  message: string;
  suggestion?: string;
};

export type PreflightReport = {
  /** 0–100. Computed from verified / total. */
  score: number;
  /** True when score >= 95 and no high-severity issues. */
  ready: boolean;
  totalCitations: number;
  verifiedCitations: number;
  outdatedCitations: number;
  pendingCitations: number;
  unverifiableCitations: number;
  issues: PreflightIssue[];
  generatedAt: number;
};

type VerifyResult = {
  citation_ref: string;
  estado?: string;
  rubro?: string;
  url_oficial?: string;
};

const REVIEW_READY_THRESHOLD = 95;

export async function runPreflight(html: string): Promise<PreflightReport> {
  const issues: PreflightIssue[] = [];
  const text = html ?? '';
  const trimmed = text.replace(/<[^>]+>/g, '').trim();
  if (!trimmed) {
    return {
      score: 0,
      ready: false,
      totalCitations: 0,
      verifiedCitations: 0,
      outdatedCitations: 0,
      pendingCitations: 0,
      unverifiableCitations: 0,
      issues: [
        {
          type: 'empty_document',
          severity: 'high',
          message: 'El documento está vacío. Escribe contenido antes de validar.',
        },
      ],
      generatedAt: Date.now(),
    };
  }

  const extracted: ExtractedCitation[] = extractCitations(text);
  if (extracted.length === 0) {
    return {
      score: 100,
      ready: false,
      totalCitations: 0,
      verifiedCitations: 0,
      outdatedCitations: 0,
      pendingCitations: 0,
      unverifiableCitations: 0,
      issues: [
        {
          type: 'no_citations',
          severity: 'info',
          message:
            'No se detectaron citas jurídicas. Revisa si el escrito requiere fundamentación.',
        },
      ],
      generatedAt: Date.now(),
    };
  }

  // Verify against backend.
  const refs = extracted.map((c) => c.ref);
  let results: VerifyResult[] = [];
  try {
    const res = await fetch('/api/citations/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ citation_refs: refs }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Verify failed (${res.status}): ${errText.slice(0, 120)}`);
    }
    results = (await res.json()) as VerifyResult[];
  } catch (e) {
    // Fail open: report unverifiable issues so the user is aware.
    const msg = e instanceof Error ? e.message : 'Error verificando';
    return {
      score: 0,
      ready: false,
      totalCitations: extracted.length,
      verifiedCitations: 0,
      outdatedCitations: 0,
      pendingCitations: 0,
      unverifiableCitations: extracted.length,
      issues: [
        {
          type: 'unverifiable_citation',
          severity: 'high',
          message: `No se pudo verificar contra fuentes oficiales (${msg}). Reintenta antes de presentar.`,
        },
      ],
      generatedAt: Date.now(),
    };
  }

  const byRef = new Map<string, VerifyResult>(results.map((r) => [r.citation_ref, r]));

  let verified = 0;
  let outdated = 0;
  let pending = 0;
  let unverifiable = 0;

  for (const c of extracted) {
    const r = byRef.get(c.ref);
    const status: CitationStatus = mapBackendStatus(r?.estado);
    if (status === 'verified') verified++;
    else if (status === 'outdated') {
      outdated++;
      issues.push({
        type: 'outdated_citation',
        severity: 'high',
        ref: c.ref,
        message: `${c.ref} está derogada o superada según fuentes oficiales.`,
        suggestion: 'Reemplázala por la versión vigente o por jurisprudencia equivalente.',
      });
    } else if (status === 'pending') {
      pending++;
      issues.push({
        type: 'pending_citation',
        severity: 'medium',
        ref: c.ref,
        message: `${c.ref} aparece como sospechosa: amerita revisión manual.`,
      });
    } else {
      unverifiable++;
      issues.push({
        type: 'unverifiable_citation',
        severity: 'medium',
        ref: c.ref,
        message: `${c.ref} no se encontró en fuentes oficiales.`,
        suggestion: 'Verifica el número/año o reemplázala por una cita verificable.',
      });
    }
  }

  const total = extracted.length;
  const score = total === 0 ? 100 : Math.round((verified / total) * 100);
  const hasHigh = issues.some((i) => i.severity === 'high');
  const ready = !hasHigh && score >= REVIEW_READY_THRESHOLD;

  return {
    score,
    ready,
    totalCitations: total,
    verifiedCitations: verified,
    outdatedCitations: outdated,
    pendingCitations: pending,
    unverifiableCitations: unverifiable,
    issues,
    generatedAt: Date.now(),
  };
}

export function preflightSummary(r: PreflightReport): string {
  if (r.totalCitations === 0) return 'Sin citas detectadas';
  return `${r.verifiedCitations}/${r.totalCitations} citas verificadas`;
}
