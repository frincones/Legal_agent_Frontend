import { describe, expect, it } from 'vitest';
import {
  extractVariables,
  humanizeVariableName,
  substituteVariables,
  unfilledVariables,
} from '@/lib/templates/variables';

describe('template variables', () => {
  it('returns empty array on empty template', () => {
    expect(extractVariables('')).toEqual([]);
    expect(extractVariables('Sin placeholders aquí.')).toEqual([]);
  });

  it('extracts unique variables in declaration order', () => {
    const t = 'Hola {{nombre}}, NIT {{nit}}, otra vez {{nombre}}.';
    expect(extractVariables(t)).toEqual(['nombre', 'nit']);
  });

  it('tolerates whitespace inside braces', () => {
    expect(extractVariables('Hola {{ nombre }} y {{  nit  }}.')).toEqual(['nombre', 'nit']);
  });

  it('rejects invalid names (numbers leading, spaces, hyphens)', () => {
    expect(extractVariables('{{1nombre}} {{a-b}} {{a b}} {{ok_var}}')).toEqual(['ok_var']);
  });

  it('substitutes provided values, leaves unknown intact', () => {
    const t = 'Sr. {{nombre}}, identificado con C.C. {{cedula}}.';
    expect(substituteVariables(t, { nombre: 'Juan Aguilar' })).toBe(
      'Sr. Juan Aguilar, identificado con C.C. {{cedula}}.',
    );
  });

  it('substitutes ALL occurrences of the same variable', () => {
    const t = '{{x}} y {{x}} y otra vez {{x}}';
    expect(substituteVariables(t, { x: 'A' })).toBe('A y A y otra vez A');
  });

  it('unfilledVariables reports the gap', () => {
    const t = 'Hola {{a}} y {{b}} y {{c}}.';
    expect(unfilledVariables(t, { a: 'foo' })).toEqual(['b', 'c']);
  });

  it('humanizeVariableName produces a sentence-case label', () => {
    expect(humanizeVariableName('nombre_cliente')).toBe('Nombre Cliente');
    expect(humanizeVariableName('caso.titulo')).toBe('Caso Titulo');
  });
});
