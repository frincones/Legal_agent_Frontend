import { describe, expect, it } from 'vitest';
import { extractCitations } from '@/lib/citations/extract';

describe('extractCitations', () => {
  it('returns empty array on empty input', () => {
    expect(extractCitations('')).toEqual([]);
    expect(extractCitations('  \n\t  ')).toEqual([]);
  });

  it('extracts tutela citation with slash format', () => {
    const out = extractCitations('Sirve la sentencia T-388/2019 sobre estabilidad.');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ ref: 'T-388/2019', type: 'tutela' });
  });

  it('extracts constitucionalidad and unificacion together', () => {
    const out = extractCitations('Aplica C-200/1995 y SU-449/2020.');
    const refs = out.map((c) => c.ref).sort();
    expect(refs).toEqual(['C-200/1995', 'SU-449/2020']);
  });

  it('deduplicates repeated references', () => {
    const out = extractCitations('T-388/2019 y de nuevo T-388/2019, T-388 de 2019.');
    expect(out).toHaveLength(1);
    expect(out[0]?.ref).toBe('T-388/2019');
  });

  it('normalizes 2-digit years', () => {
    const out = extractCitations('Aplica T-388/19 y la C-100/95.');
    const refs = out.map((c) => c.ref).sort();
    expect(refs).toEqual(['C-100/1995', 'T-388/2019']);
  });

  it('extracts leyes', () => {
    const out = extractCitations('Conforme a la Ley 50 de 1990 y la Ley 789 de 2002.');
    const refs = out.map((c) => c.ref).sort();
    expect(refs).toEqual(['Ley 50/1990', 'Ley 789/2002']);
    expect(out.every((c) => c.type === 'ley')).toBe(true);
  });

  it('extracts decretos including reglamentarios', () => {
    const out = extractCitations(
      'Conforme al Decreto 1572 de 2024 y el Decreto Reglamentario 1083 de 2015.',
    );
    const refs = out.map((c) => c.ref).sort();
    expect(refs).toEqual(['Decreto 1083/2015', 'Decreto 1572/2024']);
  });

  it('strips HTML before extraction', () => {
    const html =
      '<p>Sirve la <a class="cite-verified">T-388/2019</a> y el Art. 64 CST.</p>';
    const out = extractCitations(html);
    expect(out.find((c) => c.ref === 'T-388/2019')).toBeTruthy();
  });

  it('handles casacion laboral SL format', () => {
    const out = extractCitations('La sentencia SL-12345/2021 establece...');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      ref: 'SL-12345/2021',
      type: 'casacion_laboral',
    });
  });

  it('returns empty when there are no recognizable citations', () => {
    expect(extractCitations('Esta es una nota libre sin sentencias.')).toEqual([]);
  });

  it('extracts multiple citation types in one document', () => {
    const text = `
      HONORABLE JUEZ:
      Conforme al Art. 64 del CST modificado por la Ley 789 de 2002,
      y la jurisprudencia T-388/2019 y SU-449/2020, junto con el
      Decreto 1572 de 2024, se solicita...
    `;
    const refs = extractCitations(text)
      .map((c) => c.ref)
      .sort();
    expect(refs).toEqual([
      'Decreto 1572/2024',
      'Ley 789/2002',
      'SU-449/2020',
      'T-388/2019',
    ]);
  });
});
