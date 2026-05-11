import { describe, expect, it } from 'vitest';
import { suggestFilename } from '@/lib/docx/exportFromTipTap';

describe('suggestFilename', () => {
  it('appends current ISO date as .docx', () => {
    const today = new Date().toISOString().slice(0, 10);
    const out = suggestFilename('Demanda Laboral');
    expect(out).toMatch(/^demanda_laboral_\d{4}-\d{2}-\d{2}\.docx$/);
    expect(out).toContain(today);
  });

  it('falls back to "documento" when base is missing', () => {
    const out = suggestFilename(undefined);
    expect(out).toMatch(/^documento_\d{4}-\d{2}-\d{2}\.docx$/);
  });

  it('strips diacritics and unsafe characters', () => {
    const out = suggestFilename('Acción de Tutela: María vs/Avianca!');
    expect(out).toMatch(/^accion_de_tutela_maria_vs_avianca_\d{4}-\d{2}-\d{2}\.docx$/);
  });

  it('lowercases and trims length', () => {
    const long = 'A'.repeat(200);
    const out = suggestFilename(long);
    // Trimmed to <=80 chars + _YYYY-MM-DD + .docx
    expect(out.length).toBeLessThanOrEqual(80 + '_2025-01-01.docx'.length);
    expect(out).toBe(out.toLowerCase());
  });

  it('handles empty string by falling back to documento', () => {
    const out = suggestFilename('');
    expect(out).toMatch(/^documento_\d{4}-\d{2}-\d{2}\.docx$/);
  });
});
