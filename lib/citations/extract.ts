/**
 * Citation extraction utilities.
 *
 * Pure functions, no side effects. Extract Colombian legal citations
 * (Corte Constitucional, Corte Suprema, leyes, decretos) from a body
 * of text or markdown.
 *
 * Backend reference: backend/api/citations.py supports:
 *   - Tutela:           T-XXX/AAAA
 *   - Constitucionalidad: C-XXX/AAAA
 *   - Unificación:      SU-XXX/AAAA
 *   - Casación laboral: SL-XXXXX-AAAA
 *   - Casación civil:   SC-XXXXX-AAAA
 *   - Casación penal:   SP-XXXXX-AAAA
 */

export type CitationType =
  | 'tutela'
  | 'constitucionalidad'
  | 'unificacion'
  | 'casacion_laboral'
  | 'casacion_civil'
  | 'casacion_penal'
  | 'ley'
  | 'decreto';

export type ExtractedCitation = {
  /** Normalized canonical reference (e.g. "T-388/2019"). */
  ref: string;
  type: CitationType;
  /** Original raw match as found in the source text. */
  rawMatch: string;
};

const SENTENCIA_TYPE_MAP: Record<string, CitationType> = {
  T: 'tutela',
  C: 'constitucionalidad',
  SU: 'unificacion',
  SL: 'casacion_laboral',
  SC: 'casacion_civil',
  SP: 'casacion_penal',
};

const SENTENCIA_RE = /\b(SU|SL|SC|SP|T|C)[-\s]?(\d{1,5})[/\-\s](?:de\s+)?(\d{2,4})\b/gi;
const LEY_RE = /\bLey\s+(\d{1,5})\s+(?:de|del|\/)\s*(\d{2,4})\b/gi;
const DECRETO_RE = /\bDecreto(?:\s+(?:Ley|Reglamentario))?\s+(\d{1,5})\s+(?:de|del|\/)\s*(\d{2,4})\b/gi;

function normalizeYear(yyyy: string): string {
  if (yyyy.length === 2) {
    const n = parseInt(yyyy, 10);
    // Heurística simple: 00-39 → 2000s, 40-99 → 1900s
    return n < 40 ? `20${yyyy.padStart(2, '0')}` : `19${yyyy}`;
  }
  return yyyy.padStart(4, '0');
}

/**
 * Extract all unique legal citations from a piece of text.
 * Strips HTML tags before scanning to avoid catching attribute values.
 */
export function extractCitations(input: string): ExtractedCitation[] {
  if (!input) return [];

  // Strip HTML/markdown noise. We don't need a perfect parser; the
  // citation regexes are robust enough that residual tags are harmless.
  const text = input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  const seen = new Set<string>();
  const out: ExtractedCitation[] = [];

  // Sentencias (T, C, SU, SL, SC, SP)
  for (const m of text.matchAll(SENTENCIA_RE)) {
    const tipoRaw = (m[1] ?? '').toUpperCase();
    const tipo = SENTENCIA_TYPE_MAP[tipoRaw];
    if (!tipo) continue;
    const numero = m[2] ?? '';
    const anio = normalizeYear(m[3] ?? '');
    if (!numero || !anio) continue;
    const ref = `${tipoRaw}-${numero}/${anio}`;
    if (seen.has(ref)) continue;
    seen.add(ref);
    out.push({ ref, type: tipo, rawMatch: m[0] });
  }

  // Leyes
  for (const m of text.matchAll(LEY_RE)) {
    const numero = m[1] ?? '';
    const anio = normalizeYear(m[2] ?? '');
    if (!numero || !anio) continue;
    const ref = `Ley ${numero}/${anio}`;
    if (seen.has(ref)) continue;
    seen.add(ref);
    out.push({ ref, type: 'ley', rawMatch: m[0] });
  }

  // Decretos
  for (const m of text.matchAll(DECRETO_RE)) {
    const numero = m[1] ?? '';
    const anio = normalizeYear(m[2] ?? '');
    if (!numero || !anio) continue;
    const ref = `Decreto ${numero}/${anio}`;
    if (seen.has(ref)) continue;
    seen.add(ref);
    out.push({ ref, type: 'decreto', rawMatch: m[0] });
  }

  return out;
}

/** Pretty label for UI (Spanish, short). */
export function citationTypeLabel(t: CitationType): string {
  switch (t) {
    case 'tutela':
      return 'Tutela';
    case 'constitucionalidad':
      return 'Constitucionalidad';
    case 'unificacion':
      return 'Unificación';
    case 'casacion_laboral':
      return 'Casación laboral';
    case 'casacion_civil':
      return 'Casación civil';
    case 'casacion_penal':
      return 'Casación penal';
    case 'ley':
      return 'Ley';
    case 'decreto':
      return 'Decreto';
  }
}
