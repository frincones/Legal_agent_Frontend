/**
 * F1-T11 · LexAI UX v2 — Item Mapping
 *
 * Mapeo completo de los 23 items del sidebar legacy (SidebarKey) a su
 * destino en el nuevo paradigma v2.
 *
 * Destinos posibles:
 *   sidebar  → item visible en SidebarV2 top 5
 *   cmdk     → accesible vía Cmd+K como comando
 *   home-section  → integrado en Day Briefing (Fase 2)
 *   topbar   → badge/notificación en TopBar
 *   settings → en Configuración del despacho
 *   matter   → dentro del thread/artifact del caso
 *   canvas   → en el canvas de documentos
 *
 * Este archivo es SOLO referencia documental. No renderiza nada.
 * Garantiza que ninguna funcionalidad se pierde en la migración.
 */

export type V2ItemDestination =
  | 'sidebar'
  | 'cmdk'
  | 'home-section'
  | 'topbar'
  | 'settings'
  | 'matter'
  | 'canvas';

export type ItemMapping = {
  /** Destino principal en v2 */
  destination: V2ItemDestination;
  /** Si destino es 'sidebar', cuál item v2 */
  v2Item?: 'Inicio' | 'Casos' | 'Documentos' | 'Calendario' | 'Skills';
  /** Si destino es 'cmdk', el label del comando */
  command?: string;
  /** Ruta directa de acceso en v2 */
  route?: string;
  /** Nota de implementación o sprint al que corresponde */
  note?: string;
};

export const itemMapping: Record<string, ItemMapping> = {
  'inicio': {
    destination: 'sidebar',
    v2Item: 'Inicio',
    note: 'Home thread del día (Fase 2)',
  },
  'mi-dia': {
    destination: 'home-section',
    note: 'Integrado en Day Briefing thread (Fase 2 · F2-T02)',
  },
  'tareas': {
    destination: 'cmdk',
    command: 'Ver mis tareas',
    route: '/tareas',
    note: 'Accesible vía Cmd+K + /ask "¿cuáles son mis tareas?"',
  },
  'dashboard': {
    destination: 'cmdk',
    command: 'Dashboard ejecutivo',
    route: '/dashboard',
    note: 'Accesible vía Cmd+K · dashboard como Artifact en home thread',
  },
  'casos': {
    destination: 'sidebar',
    v2Item: 'Casos',
    route: '/casos',
  },
  'canvas': {
    destination: 'cmdk',
    command: 'Abrir canvas en vivo',
    route: '/canvas',
    note: 'Cmd+L · también desde botón en thread de caso',
  },
  'clientes': {
    destination: 'cmdk',
    command: 'Buscar cliente',
    route: '/clientes',
    note: 'Cmd+K prefijo @ · también /casos?cliente=X',
  },
  'calendario': {
    destination: 'sidebar',
    v2Item: 'Calendario',
    route: '/calendario',
    note: 'También como Artifact en home thread (Fase 2)',
  },
  'documentos': {
    destination: 'sidebar',
    v2Item: 'Documentos',
    route: '/documentos',
  },
  'kb': {
    destination: 'cmdk',
    command: 'Buscar en base de conocimiento',
    route: '/kb',
    note: 'Cmd+K texto libre · resultados semánticos via pgvector',
  },
  'jueces': {
    destination: 'matter',
    note: 'Artifact "Perspectiva del juez" dentro del thread del caso',
  },
  'actividad': {
    destination: 'sidebar',
    note: 'El historial de hilos en SidebarV2 ES la actividad del despacho',
  },
  'menciones': {
    destination: 'topbar',
    note: 'Badge en TopBar (Fase 2 · TopBar v2)',
  },
  'inbox': {
    destination: 'topbar',
    note: 'Notificaciones HITL + judicial en badge TopBar',
  },
  'buscar': {
    destination: 'cmdk',
    command: 'Búsqueda global',
    note: 'Cmd+K es la búsqueda global en v2',
  },
  'reportes': {
    destination: 'cmdk',
    command: 'Ver reportes del despacho',
    route: '/reportes',
    note: 'Cmd+K o pregunta: "muéstrame los reportes del mes"',
  },
  'facturacion': {
    destination: 'cmdk',
    command: 'Facturación',
    route: '/facturacion',
  },
  'trust': {
    destination: 'cmdk',
    command: 'Fondos cliente',
    route: '/trust',
  },
  'firmas': {
    destination: 'canvas',
    note: 'Botón "Firmar" en toolbar del Canvas (Fase 5)',
  },
  'marketplace': {
    destination: 'cmdk',
    command: 'Marketplace',
    route: '/marketplace',
  },
  'leads': {
    destination: 'cmdk',
    command: 'Ver leads y pipeline',
    route: '/leads',
  },
  'intake': {
    destination: 'cmdk',
    command: 'Formularios de intake',
    route: '/intake-forms',
  },
  'insights': {
    destination: 'home-section',
    note: 'LexAI los sugiere proactivamente en el Day Briefing thread (Fase 2)',
  },
  'automation': {
    destination: 'settings',
    route: '/settings/despacho#automation',
    note: 'Settings → Automatización',
  },
};

/**
 * Retorna todos los items que NO tienen un destino en el sidebar v2
 * (útil para auditar qué items solo son accesibles vía Cmd+K).
 */
export function getItemsNotInSidebar(): string[] {
  return Object.entries(itemMapping)
    .filter(([, v]) => v.destination !== 'sidebar')
    .map(([k]) => k);
}

/**
 * Retorna todos los items accesibles vía Cmd+K.
 */
export function getCmdkItems(): Array<{ key: string; command: string; route?: string }> {
  return Object.entries(itemMapping)
    .filter(([, v]) => v.destination === 'cmdk')
    .map(([key, v]) => ({
      key,
      command: v.command ?? key,
      route: v.route,
    }));
}
