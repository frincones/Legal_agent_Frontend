/**
 * Template variables · parser y sustitución de `{{nombre}}` placeholders.
 *
 * Usado por:
 *   · /settings/templates/[id] · vista previa con campos editables
 *   · components/canvas/TemplateInsertDialog · al insertar en canvas
 *
 * Reglas:
 *   · Variables tienen sintaxis `{{ nombre_variable }}` (whitespace tolerated).
 *   · Nombres válidos: alfanuméricos + underscore + dot. No espacios.
 *   · Sustitución es global (todas las ocurrencias del mismo nombre).
 */

const VAR_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_.]*)\s*\}\}/g;

export function extractVariables(template: string): string[] {
  if (!template) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of template.matchAll(VAR_RE)) {
    const name = m[1];
    if (name && !seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  }
  return out;
}

export function substituteVariables(
  template: string,
  values: Record<string, string>,
): string {
  if (!template) return '';
  return template.replace(VAR_RE, (full, name: string) => {
    const v = values[name];
    if (v === undefined || v === '') return full; // leave unfilled
    return v;
  });
}

/** Returns the variables that the user did NOT fill yet. */
export function unfilledVariables(
  template: string,
  values: Record<string, string>,
): string[] {
  return extractVariables(template).filter((v) => !values[v]);
}

/** Pretty-print a variable name as a label (snake_case → "Sentence case"). */
export function humanizeVariableName(name: string): string {
  return name
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
