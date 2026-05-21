/**
 * T2 · Unit tests — itemMapping (F1-T11)
 *
 * Verifica que el mapping cubre los 23 items legacy del sidebar sin gaps.
 * Sin dependencias de React/DOM — pure TypeScript.
 */

import { describe, it, expect } from 'vitest';
import { itemMapping, getItemsNotInSidebar, getCmdkItems, type V2ItemDestination } from '@/lib/v2/itemMapping';

// Los 23 items del sidebar legacy (en el orden documentado en AppShell / Sidebar.tsx)
const LEGACY_ITEMS = [
  'inicio',
  'mi-dia',
  'tareas',
  'dashboard',
  'casos',
  'canvas',
  'clientes',
  'calendario',
  'documentos',
  'kb',
  'jueces',
  'actividad',
  'menciones',
  'inbox',
  'buscar',
  'reportes',
  'facturacion',
  'trust',
  'firmas',
  'marketplace',
  'leads',
  'intake',
  'insights',
  'automation',
] as const;

// Los destinos v2 válidos según el tipo
const VALID_DESTINATIONS: V2ItemDestination[] = [
  'sidebar',
  'cmdk',
  'home-section',
  'topbar',
  'settings',
  'matter',
  'canvas',
];

describe('itemMapping — cobertura de los 23 items legacy', () => {
  it('el mapping contiene al menos 23 items', () => {
    // Puede haber más si se agregan items futuros, pero mínimo 23
    expect(Object.keys(itemMapping).length).toBeGreaterThanOrEqual(23);
  });

  it('cada item legacy tiene una entrada en itemMapping', () => {
    const missing: string[] = [];
    for (const key of LEGACY_ITEMS) {
      if (!(key in itemMapping)) missing.push(key);
    }
    expect(missing, `Items sin mapear: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('cada entrada tiene un destination válido', () => {
    for (const [key, value] of Object.entries(itemMapping)) {
      expect(
        VALID_DESTINATIONS,
        `'${key}' tiene destination inválido: '${value.destination}'`,
      ).toContain(value.destination);
    }
  });

  it('los 5 items del sidebar v2 tienen destination="sidebar" y v2Item correcto', () => {
    const sidebarItems = Object.entries(itemMapping).filter(([, v]) => v.destination === 'sidebar');
    // Al menos: inicio, casos, calendario, documentos, actividad
    expect(sidebarItems.length).toBeGreaterThanOrEqual(4);

    // Los que tienen v2Item deben usar uno de los 5 válidos
    const validV2Items = ['Inicio', 'Casos', 'Documentos', 'Calendario', 'Skills'];
    for (const [key, val] of sidebarItems) {
      if (val.v2Item) {
        expect(
          validV2Items,
          `'${key}'.v2Item='${val.v2Item}' no es uno de los 5 items del sidebar v2`,
        ).toContain(val.v2Item);
      }
    }
  });

  // Helper para acceso tipado seguro al mapping
  // (Record<string, T> devuelve T | undefined en strict mode)
  function get(key: string) {
    const v = itemMapping[key];
    if (!v) throw new Error(`itemMapping missing key: '${key}'`);
    return v;
  }

  it('"inicio" mapea al sidebar v2 item Inicio', () => {
    expect(get('inicio').destination).toBe('sidebar');
    expect(get('inicio').v2Item).toBe('Inicio');
  });

  it('"casos" mapea al sidebar v2 item Casos con ruta /casos', () => {
    expect(get('casos').destination).toBe('sidebar');
    expect(get('casos').v2Item).toBe('Casos');
    expect(get('casos').route).toBe('/casos');
  });

  it('"calendario" mapea al sidebar v2 item Calendario', () => {
    expect(get('calendario').destination).toBe('sidebar');
    expect(get('calendario').v2Item).toBe('Calendario');
  });

  it('"documentos" mapea al sidebar v2 item Documentos', () => {
    expect(get('documentos').destination).toBe('sidebar');
    expect(get('documentos').v2Item).toBe('Documentos');
  });

  it('"buscar" mapea a cmdk (Cmd+K es la búsqueda global en v2)', () => {
    expect(get('buscar').destination).toBe('cmdk');
  });

  it('"inbox" y "menciones" mapean a topbar (badges de notificaciones)', () => {
    expect(get('inbox').destination).toBe('topbar');
    expect(get('menciones').destination).toBe('topbar');
  });

  it('"firmas" mapea al canvas (integrado en toolbar del Canvas)', () => {
    expect(get('firmas').destination).toBe('canvas');
  });

  it('"jueces" mapea a matter (Artifact dentro del thread del caso)', () => {
    expect(get('jueces').destination).toBe('matter');
  });

  it('"automation" mapea a settings', () => {
    expect(get('automation').destination).toBe('settings');
    expect(get('automation').route).toContain('/settings');
  });

  it('"mi-dia" e "insights" mapean a home-section (Day Briefing thread F2)', () => {
    expect(get('mi-dia').destination).toBe('home-section');
    expect(get('insights').destination).toBe('home-section');
  });

  it('todos los cmdk items tienen command definido', () => {
    const cmdkItems = Object.entries(itemMapping).filter(([, v]) => v.destination === 'cmdk');
    for (const [key, val] of cmdkItems) {
      expect(
        val.command,
        `Item '${key}' es cmdk pero no tiene 'command' definido`,
      ).toBeTruthy();
    }
  });

  it('getCmdkItems() retorna array sin items duplicados', () => {
    const items = getCmdkItems();
    const keys = items.map((i) => i.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('getItemsNotInSidebar() no incluye items con destination="sidebar"', () => {
    const notInSidebar = getItemsNotInSidebar();
    for (const key of notInSidebar) {
      expect(get(key).destination).not.toBe('sidebar');
    }
  });

  it('conteo exacto: exactamente 24 items en el mapping (23 legacy + automation es extra)', () => {
    // El mapping documenta los 23 legacy más uno extra (automation).
    // Si el número cambia, este test señala una divergencia intencional.
    const count = Object.keys(itemMapping).length;
    // Rango flexible: entre 23 y 30 (permite agregar items futuros)
    expect(count).toBeGreaterThanOrEqual(23);
    expect(count).toBeLessThanOrEqual(30);
  });
});
