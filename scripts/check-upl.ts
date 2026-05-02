/**
 * UPL (Unauthorized Practice of Law) linter.
 *
 * Scans app/, components/ for prohibited copy that exposes LexAI to UPL claims.
 * Run in CI: `pnpm lint:upl` exits non-zero on any match → blocks merge.
 *
 * Allowed:
 *   ✓ "información legal de calidad profesional"
 *   ✓ "asistente legal AI"
 *   ✓ "software de generación de documentos legales"
 *
 * Forbidden (regex below):
 *   ✗ "robot abogado" / "AI lawyer" / "abogado AI"
 *   ✗ "reemplaza a tu abogado"
 *   ✗ "asesoría legal personalizada"
 *   ✗ "garantizo el resultado" / "su caso ganará"
 *   ✗ "100% sin alucinaciones"
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['app', 'components', 'lib'];

const FORBIDDEN: Array<{ pattern: RegExp; rationale: string }> = [
  { pattern: /\brobot\s+abogado\b/i, rationale: '"robot abogado" — implica representación legal' },
  { pattern: /\bAI\s+lawyer\b/i, rationale: '"AI lawyer" — implica representación legal' },
  { pattern: /\babogado\s+AI\b/i, rationale: '"abogado AI" — implica representación legal' },
  { pattern: /reemplaz[ao]\s+a\s+(tu|su|el)\s+abogado/i, rationale: 'sustitución del abogado titulado' },
  { pattern: /asesor[ií]a\s+legal\s+personalizada/i, rationale: 'asesoría personalizada = ejercicio profesional' },
  { pattern: /garantiz[ao]\s+(el\s+)?resultado/i, rationale: 'garantía de resultado procesal' },
  { pattern: /(su|tu)\s+caso\s+ganar[áa]/i, rationale: 'predicción de resultado procesal' },
  { pattern: /100%\s+sin\s+alucinaciones/i, rationale: 'el PRD prohíbe absolutos sobre alucinación' },
  { pattern: /documentos\s+perfectamente\s+v[áa]lidos\s+garantizados/i, rationale: 'no garantizar validez procesal' },
];

const TEXT_EXTS = new Set(['.ts', '.tsx', '.md', '.mdx']);

let exitCode = 0;
const offenses: Array<{ file: string; line: number; match: string; rationale: string }> = [];

function walk(dir: string): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === '.next' || entry === 'tests') continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
    } else {
      const ext = full.slice(full.lastIndexOf('.'));
      if (!TEXT_EXTS.has(ext)) continue;
      const text = readFileSync(full, 'utf8');
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        for (const { pattern, rationale } of FORBIDDEN) {
          const m = line.match(pattern);
          if (m) {
            offenses.push({ file: full, line: i + 1, match: m[0], rationale });
            exitCode = 1;
          }
        }
      }
    }
  }
}

for (const root of ROOTS) {
  try {
    walk(root);
  } catch {
    // root may not exist; ignore
  }
}

if (offenses.length > 0) {
  console.error(`\n[UPL linter] ${offenses.length} infracciones encontradas:\n`);
  for (const o of offenses) {
    console.error(`  ${o.file}:${o.line}`);
    console.error(`    "${o.match}"`);
    console.error(`    → ${o.rationale}\n`);
  }
  console.error('UPL linter falló · revisa el copy y elimina las frases prohibidas (PRD §9.2).\n');
} else {
  console.log('[UPL linter] OK · sin frases prohibidas en copy.');
}

process.exit(exitCode);
