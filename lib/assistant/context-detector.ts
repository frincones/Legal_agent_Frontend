/**
 * Context detector — turns a Next.js pathname into a structured PageContext
 * the agent can reason about ("where is the user right now?").
 *
 * Pure function: easy to test, no React/Next dependency.
 *
 * Source of truth for tool scope:
 *  - When PageContext.area === 'matter' the agent gets matter-scoped tools
 *    (calc_*, matter_*, canvas_*) without asking for matter_id.
 *  - When area === 'matters_list' the agent gets cross-matter reporting tools.
 *  - Other areas restrict to navigation + global search.
 */

import type { PageContext } from './types';

/**
 * Matches /casos/[id] and /casos/[id]/anything.
 * matterId can be a UUID, slug, or numeric — we accept the raw segment.
 */
const MATTER_ROUTE_RE = /^\/casos\/([^\/]+)(?:\/.*)?$/;
const DOCUMENT_ROUTE_RE = /^\/documentos\/([^\/]+)(?:\/.*)?$/;

export function detectContext(pathname: string): PageContext {
  const now = Date.now();
  const route = pathname || '/';

  // Matter routes — most important: gives the agent matter_id automatically.
  const matterMatch = route.match(MATTER_ROUTE_RE);
  if (matterMatch) {
    return {
      route,
      area: 'matter',
      matterId: matterMatch[1],
      detectedAt: now,
    };
  }

  // Document route (legacy / direct doc view).
  const docMatch = route.match(DOCUMENT_ROUTE_RE);
  if (docMatch) {
    return {
      route,
      area: 'documents',
      documentId: docMatch[1],
      detectedAt: now,
    };
  }

  // Top-level area detection — keep cheap, order matters (longest prefix first).
  if (route === '/casos' || route.startsWith('/casos?')) {
    return { route, area: 'matters_list', detectedAt: now };
  }
  if (route.startsWith('/documentos')) {
    return { route, area: 'documents', detectedAt: now };
  }
  if (route.startsWith('/inbox')) {
    return { route, area: 'inbox', detectedAt: now };
  }
  if (route.startsWith('/calendar') || route.startsWith('/agenda')) {
    return { route, area: 'calendar', detectedAt: now };
  }
  if (route.startsWith('/settings')) {
    return { route, area: 'settings', detectedAt: now };
  }
  if (route.startsWith('/admin')) {
    return { route, area: 'admin', detectedAt: now };
  }
  if (route === '/' || route === '/home' || route === '/inicio') {
    return { route, area: 'home', detectedAt: now };
  }

  return { route, area: 'other', detectedAt: now };
}

/**
 * Hint string the AssistantHeader shows to the user (and the agent uses
 * as a prefix in its first message). Kept short and human-readable.
 */
export function describeContext(ctx: PageContext): string {
  switch (ctx.area) {
    case 'matter':
      return ctx.matterMeta?.titulo
        ? `Caso · ${ctx.matterMeta.titulo}`
        : `Caso ${ctx.matterId ?? ''}`.trim();
    case 'matters_list':
      return 'Mis casos';
    case 'documents':
      return ctx.documentId ? 'Documento abierto' : 'Documentos';
    case 'inbox':
      return 'Bandeja';
    case 'calendar':
      return 'Agenda';
    case 'settings':
      return 'Configuración';
    case 'admin':
      return 'Administración';
    case 'home':
      return 'Inicio';
    default:
      return 'Modo global';
  }
}

/**
 * Returns true if the agent should auto-scope tool calls to a single matter
 * (so the user doesn't have to repeat "for case 3245" in every turn).
 */
export function isMatterScoped(ctx: PageContext): boolean {
  return ctx.area === 'matter' && Boolean(ctx.matterId);
}

/**
 * Whether the context has changed meaningfully (new matter / area).
 * Used to decide if the agent should refresh its mental model.
 */
export function contextChanged(prev: PageContext | null, next: PageContext): boolean {
  if (!prev) return true;
  if (prev.area !== next.area) return true;
  if (prev.matterId !== next.matterId) return true;
  if (prev.documentId !== next.documentId) return true;
  return false;
}
