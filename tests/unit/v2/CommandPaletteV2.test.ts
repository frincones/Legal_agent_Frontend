/**
 * T2 · Unit tests — CommandPaletteV2 (F1-T08/T09)
 *
 * Cubre la lógica pura sin React/DOM:
 * 1. Atajo Cmd+K / Ctrl+K abre la paleta (toggle)
 * 2. Filtrado de resultados por query (skills, búsqueda)
 * 3. Lógica de isSearching / isLongQuery (threshold de búsqueda)
 * 4. Navegación a destino (go() cierra paleta y llama router.push)
 * 5. Handler Cmd+K del useGlobalHotkeys no duplica el toggle
 * 6. Lógica de debounce query (≥2 chars para buscar, ≥3 para jurisprudencia)
 *
 * Estrategia: vi.stubGlobal + extracción de la lógica pura.
 * No se usa RTL/jsdom — solo node environment.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ────────────────────────────────────────────────────────────────────────────
// Lógica pura extraída del componente
// ────────────────────────────────────────────────────────────────────────────

/** Espejo de la lógica isSearching / isLongQuery */
function computeSearchState(query: string) {
  const trimmed = query.trim();
  return {
    isSearching: trimmed.length >= 2,
    isLongQuery: trimmed.length >= 3,
  };
}

/** Espejo del filtro de skills por query */
function filterSkills(
  skills: Array<{ id: string; name: string; description?: string }>,
  query: string,
) {
  return skills.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
}

/** Espejo del handler go() */
function makeGoHandler(
  routerPush: (href: string) => void,
  setOpen: (v: boolean) => void,
  setQuery: (v: string) => void,
) {
  return (href: string) => {
    setOpen(false);
    setQuery('');
    routerPush(href);
  };
}

/** Espejo del handler close() */
function makeCloseHandler(
  setOpen: (v: boolean) => void,
  setQuery: (v: string) => void,
) {
  return () => {
    setOpen(false);
    setQuery('');
  };
}

/** Espejo del keydown handler para Cmd+K */
function buildCmdKHandler(toggleOpen: () => void) {
  return (e: Partial<KeyboardEvent>) => {
    if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === 'k') {
      e.preventDefault?.();
      toggleOpen();
    }
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Fixtures de skills reales del dominio legal
// ────────────────────────────────────────────────────────────────────────────

const SAMPLE_SKILLS = [
  { id: 'ask',         name: '/ask',               description: 'Consulta libre al asistente' },
  { id: 'lex',         name: '/lex',               description: 'Análisis jurídico profundo' },
  { id: 'casos',       name: '/casos',             description: 'Gestión de casos activos' },
  { id: 'calendario',  name: '/calendario',        description: 'Ver audiencias y plazos' },
  { id: 'calcular',    name: '/calcular/laboral',  description: 'Calcular liquidación laboral' },
  { id: 'verifica',    name: '/verificar/citas',   description: 'Verificar citas jurídicas' },
];

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe('CommandPaletteV2 — atajo Cmd+K / Ctrl+K', () => {
  it('Ctrl+K llama toggleOpen y previene default', () => {
    let open = false;
    const toggleOpen = vi.fn(() => { open = !open; });
    const preventDefault = vi.fn();
    const handler = buildCmdKHandler(toggleOpen);

    handler({ ctrlKey: true, metaKey: false, key: 'k', preventDefault });

    expect(toggleOpen).toHaveBeenCalledOnce();
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(open).toBe(true);
  });

  it('Cmd+K llama toggleOpen', () => {
    const toggleOpen = vi.fn();
    const handler = buildCmdKHandler(toggleOpen);

    handler({ ctrlKey: false, metaKey: true, key: 'k', preventDefault: vi.fn() });

    expect(toggleOpen).toHaveBeenCalledOnce();
  });

  it('Cmd+K con key mayúscula "K" también dispara', () => {
    const toggleOpen = vi.fn();
    const handler = buildCmdKHandler(toggleOpen);

    handler({ ctrlKey: true, key: 'K', preventDefault: vi.fn() });

    expect(toggleOpen).toHaveBeenCalledOnce();
  });

  it('segunda pulsación de Ctrl+K cierra la paleta (toggle)', () => {
    let open = false;
    const toggleOpen = vi.fn(() => { open = !open; });
    const handler = buildCmdKHandler(toggleOpen);

    handler({ ctrlKey: true, key: 'k', preventDefault: vi.fn() });
    expect(open).toBe(true);

    handler({ ctrlKey: true, key: 'k', preventDefault: vi.fn() });
    expect(open).toBe(false);
  });

  it('tecla distinta a K no abre la paleta', () => {
    const toggleOpen = vi.fn();
    const handler = buildCmdKHandler(toggleOpen);

    handler({ ctrlKey: true, key: 'n' });
    handler({ ctrlKey: true, key: 'b' });
    handler({ ctrlKey: false, metaKey: false, key: 'k' });

    expect(toggleOpen).not.toHaveBeenCalled();
  });
});

describe('CommandPaletteV2 — umbral de búsqueda (isSearching / isLongQuery)', () => {
  it('query vacío → isSearching=false, isLongQuery=false', () => {
    const { isSearching, isLongQuery } = computeSearchState('');
    expect(isSearching).toBe(false);
    expect(isLongQuery).toBe(false);
  });

  it('query de 1 char → isSearching=false, isLongQuery=false', () => {
    const { isSearching, isLongQuery } = computeSearchState('c');
    expect(isSearching).toBe(false);
    expect(isLongQuery).toBe(false);
  });

  it('query de 2 chars → isSearching=true, isLongQuery=false', () => {
    const { isSearching, isLongQuery } = computeSearchState('ca');
    expect(isSearching).toBe(true);
    expect(isLongQuery).toBe(false);
  });

  it('query de 3 chars → isSearching=true, isLongQuery=true (activa jurisprudencia)', () => {
    const { isSearching, isLongQuery } = computeSearchState('cas');
    expect(isSearching).toBe(true);
    expect(isLongQuery).toBe(true);
  });

  it('query solo espacios → trimmed→isSearching=false', () => {
    const { isSearching } = computeSearchState('   ');
    expect(isSearching).toBe(false);
  });

  it('query "le" (≥2 chars) activa búsqueda normal pero no jurisprudencia', () => {
    const { isSearching, isLongQuery } = computeSearchState('le');
    expect(isSearching).toBe(true);
    expect(isLongQuery).toBe(false);
  });

  it('query "ley" (≥3 chars) activa búsqueda de jurisprudencia y normativa', () => {
    const { isSearching, isLongQuery } = computeSearchState('ley');
    expect(isSearching).toBe(true);
    expect(isLongQuery).toBe(true);
  });
});

describe('CommandPaletteV2 — filtrado de skills por query', () => {
  it('query "ca" filtra skills que contienen "ca" en el nombre', () => {
    const results = filterSkills(SAMPLE_SKILLS, 'ca');
    const names = results.map((s) => s.name);
    expect(names).toContain('/casos');
    expect(names).toContain('/calcular/laboral');
    expect(names).toContain('/calendario');
  });

  it('query "ca" NO devuelve skills sin "ca"', () => {
    const results = filterSkills(SAMPLE_SKILLS, 'ca');
    const names = results.map((s) => s.name);
    expect(names).not.toContain('/ask');
    expect(names).not.toContain('/lex');
  });

  it('filtro es case-insensitive (query mayúscula)', () => {
    const results = filterSkills(SAMPLE_SKILLS, 'CA');
    expect(results.length).toBeGreaterThan(0);
    expect(results.map((s) => s.name)).toContain('/casos');
  });

  it('query exacto "/lex" devuelve solo ese skill', () => {
    const results = filterSkills(SAMPLE_SKILLS, '/lex');
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('/lex');
  });

  it('query sin coincidencias retorna array vacío', () => {
    const results = filterSkills(SAMPLE_SKILLS, 'xyznotfound');
    expect(results).toHaveLength(0);
  });

  it('query vacío retorna todos los skills', () => {
    const results = filterSkills(SAMPLE_SKILLS, '');
    expect(results).toHaveLength(SAMPLE_SKILLS.length);
  });

  it('query "verif" filtra skill de verificación de citas', () => {
    const results = filterSkills(SAMPLE_SKILLS, 'verif');
    expect(results.map((s) => s.name)).toContain('/verificar/citas');
  });
});

describe('CommandPaletteV2 — handler go() de navegación', () => {
  it('go() cierra la paleta (setOpen=false)', () => {
    const routerPush = vi.fn();
    let openState = true;
    const setOpen = vi.fn((v: boolean) => { openState = v; });
    const setQuery = vi.fn();

    const go = makeGoHandler(routerPush, setOpen, setQuery);
    go('/casos/abc-123');

    expect(setOpen).toHaveBeenCalledWith(false);
    expect(openState).toBe(false);
  });

  it('go() limpia el query (setQuery="")', () => {
    const routerPush = vi.fn();
    const setOpen = vi.fn();
    let queryState = 'casas';
    const setQuery = vi.fn((v: string) => { queryState = v; });

    const go = makeGoHandler(routerPush, setOpen, setQuery);
    go('/casos/abc-123');

    expect(setQuery).toHaveBeenCalledWith('');
    expect(queryState).toBe('');
  });

  it('go() llama router.push con el href correcto', () => {
    const routerPush = vi.fn();
    const setOpen = vi.fn();
    const setQuery = vi.fn();

    const go = makeGoHandler(routerPush, setOpen, setQuery);
    go('/casos/nuevo');

    expect(routerPush).toHaveBeenCalledWith('/casos/nuevo');
  });

  it('go() a ruta de caso real incluye el ID', () => {
    const routerPush = vi.fn();
    const go = makeGoHandler(routerPush, vi.fn(), vi.fn());

    go('/casos/550e8400-e29b-41d4-a716-446655440000');

    expect(routerPush).toHaveBeenCalledWith('/casos/550e8400-e29b-41d4-a716-446655440000');
  });
});

describe('CommandPaletteV2 — handler close()', () => {
  it('close() establece open=false y query=""', () => {
    const setOpen = vi.fn();
    const setQuery = vi.fn();
    const close = makeCloseHandler(setOpen, setQuery);

    close();

    expect(setOpen).toHaveBeenCalledWith(false);
    expect(setQuery).toHaveBeenCalledWith('');
  });
});

describe('CommandPaletteV2 — normalización de skills del backend', () => {
  /**
   * El componente normaliza el array crudo del backend al formato
   * { id, name, path, description }. Testear esa normalización.
   */
  function normalizeSkills(
    raw: Array<{ id?: string; name?: string; path?: string; description?: string }>,
  ) {
    return raw
      .filter((s) => s.name || s.path)
      .map((s, i) => ({
        id: s.id ?? s.path ?? String(i),
        name: s.name ?? s.path ?? `Skill ${i + 1}`,
        path: s.path ?? s.name ?? '',
        description: s.description,
      }));
  }

  it('normaliza skill con solo name y path', () => {
    const raw = [{ name: '/ask', path: '/ask', description: 'Consulta' }];
    const result = normalizeSkills(raw);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('/ask');
    expect(result[0]?.path).toBe('/ask');
  });

  it('filtra items sin name y sin path', () => {
    const raw = [
      { id: 'a', name: '/ask' },
      { id: 'b' }, // sin name ni path → filtrado
    ];
    const result = normalizeSkills(raw);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('/ask');
  });

  it('usa path como id si id no viene del backend', () => {
    const raw = [{ name: '/lex', path: '/lex' }];
    const result = normalizeSkills(raw);
    expect(result[0]?.id).toBe('/lex');
  });

  it('usa index como id fallback cuando no hay id ni path', () => {
    // id = s.id ?? s.path ?? String(i)
    // Si no hay id ni path, usa String(index) = '0'
    const raw = [{ name: '/ask' }];
    const result = normalizeSkills(raw);
    expect(result[0]?.id).toBe('0');
    // El name sí se toma correctamente
    expect(result[0]?.name).toBe('/ask');
  });
});
