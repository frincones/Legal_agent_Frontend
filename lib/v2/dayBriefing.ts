/**
 * F2-T01 · LexAI UX v2 — Day Briefing
 *
 * Genera el resumen del día para la home v2 (DayBriefingThread).
 * Se ejecuta server-side (RSC o Route Handler) y consume:
 *   - getCachedShellData → counts (deadlines7d, judicial, matters)
 *   - fetchMatters       → lista de matters activos para clasificar urgentes
 *
 * Datos que NO están disponibles aún en endpoints dedicados:
 *   - hearings (audiencias hoy/mañana): necesita endpoint /v1/day-briefing o
 *     /v1/matters/hearings?range=today,tomorrow
 *     → TODO backend: GET /v1/day-briefing que devuelva { hearings, novelties }
 *   - novelties (Diario Oficial afectando matters): hoy se obtiene de la data
 *     demo del UrgentCard DOF; necesita endpoint /v1/do/novelties?firm_id=X
 *     → TODO backend: GET /v1/do/novelties con join a matters activos
 *
 * Mientras esos endpoints no existan, usamos fallback vacío/demo para no
 * bloquear el render y dejamos el comentario TODO para backend.
 */

import { getCachedShellData } from '@/lib/api/cached-fetchers';
import { fetchMatters, type Matter } from '@/lib/api/rsc-fetchers';

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export type Hearing = {
  matterId: string;
  matterTitle: string;
  time: string;     // "9:00 am"
  venue: string;    // "Tribunal Superior de Bogotá"
  dayLabel: 'hoy' | 'mañana';
};

export type UrgentDeadline = {
  matterId: string;
  matterTitle: string;
  due_at: string;   // ISO string
  days_until: number;
  tipo: string;     // "Audiencia", "Vencimiento traslado", etc.
};

export type Novelty = {
  type: 'DO' | 'jurisprudencia';
  title: string;
  affectedMatters: string[]; // IDs de matters afectados
  affectedTitles: string[];  // Títulos para mostrar en UI
};

export type UrgentMatter = {
  matterId: string;
  matterTitle: string;
  reason: string;
};

export type DayBriefingData = {
  greeting: 'Buenos días' | 'Buenas tardes' | 'Buenas noches';
  userName: string;         // "Lic. Rincones"
  hearings: Hearing[];
  urgentDeadlines: UrgentDeadline[];
  novelties: Novelty[];
  urgentMatters: UrgentMatter[];
  summary: string;          // 2-3 líneas en prosa para el thread del agente
  deadlines7dCount: number; // total de plazos en próximos 7 días
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): DayBriefingData['greeting'] {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function formatUserName(fullName: string): string {
  // "Dr. Freddy Rincones" → "Lic. Rincones"
  // "Freddy Rincones Alvarado" → "Lic. Rincones"
  if (!fullName) return 'Lic.';
  const parts = fullName.replace(/^(Dr\.|Dra\.|Lic\.|Abg\.|Dr |Dra )/i, '').trim().split(' ');
  const lastName = parts.slice(-1)[0] ?? parts[0];
  return `Lic. ${lastName}`;
}

function buildUrgentDeadlines(matters: Matter[]): UrgentDeadline[] {
  const now = Date.now();
  const ms7d = 7 * 24 * 3600 * 1000;
  return matters
    .filter((m) => m.proxima_fecha && new Date(m.proxima_fecha).getTime() - now < ms7d && new Date(m.proxima_fecha).getTime() > now)
    .map((m) => ({
      matterId: m.id,
      matterTitle: m.titulo,
      due_at: m.proxima_fecha!,
      days_until: Math.round((new Date(m.proxima_fecha!).getTime() - now) / (24 * 3600 * 1000)),
      tipo: m.proxima_tipo ?? 'Plazo',
    }))
    .sort((a, b) => a.days_until - b.days_until)
    .slice(0, 5);
}

function buildUrgentMatters(matters: Matter[]): UrgentMatter[] {
  // Matters con priority=alta sin movimiento en >3 días.
  // Heurística: updated_at > 3 días atrás + priority alta.
  const now = Date.now();
  const ms3d = 3 * 24 * 3600 * 1000;
  return matters
    .filter(
      (m) =>
        m.priority === 'alta' &&
        new Date(m.updated_at).getTime() < now - ms3d,
    )
    .slice(0, 3)
    .map((m) => ({
      matterId: m.id,
      matterTitle: m.titulo,
      reason: 'Prioridad alta sin movimiento en más de 3 días',
    }));
}

/**
 * Extrae audiencias de hoy y mañana a partir de proxima_tipo + proxima_fecha.
 * TODO backend: reemplazar con datos del endpoint /v1/day-briefing
 * cuando esté disponible, para obtener hora exacta y sede.
 */
function buildHearings(matters: Matter[]): Hearing[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);
  const dayAfter = new Date(today.getTime() + 2 * 24 * 3600 * 1000);

  const hearings: Hearing[] = [];
  for (const m of matters) {
    if (!m.proxima_fecha || !m.proxima_tipo) continue;
    const tipoLower = m.proxima_tipo.toLowerCase();
    if (!tipoLower.includes('audiencia') && !tipoLower.includes('diligencia') && !tipoLower.includes('oral')) continue;
    const date = new Date(m.proxima_fecha);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let dayLabel: 'hoy' | 'mañana' | null = null;
    if (dayStart.getTime() === today.getTime()) dayLabel = 'hoy';
    else if (dayStart.getTime() === tomorrow.getTime()) dayLabel = 'mañana';
    if (!dayLabel) continue;

    hearings.push({
      matterId: m.id,
      matterTitle: m.titulo,
      // La hora exacta vendría del endpoint /v1/day-briefing (TODO backend).
      // Por ahora usamos la fecha sin hora específica.
      time: date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      venue: m.tribunal ?? 'Juzgado',
      dayLabel,
    });
  }
  return hearings.slice(0, 4);
}

/**
 * TODO backend (endpoint faltante):
 * GET /v1/do/novelties
 * Devuelve novedades del Diario Oficial que afectan matters activos de la firma.
 * Respuesta: Array<{ type: 'DO'|'jurisprudencia', title: string, matter_ids: string[] }>
 *
 * Mientras tanto, devuelve array vacío para no bloquear el render.
 */
async function fetchNovelties(_firmId: string, _matters: Matter[]): Promise<Novelty[]> {
  // TODO: llamar al endpoint cuando esté disponible.
  // Ejemplo de fallback demo que se puede habilitar para testing:
  // return [{ type: 'DO', title: 'Reforma Laboral 2026', affectedMatters: [], affectedTitles: [] }];
  return [];
}

function buildSummary(data: Omit<DayBriefingData, 'summary'>): string {
  const parts: string[] = [];

  if (data.hearings.length > 0) {
    const hoy = data.hearings.filter((h) => h.dayLabel === 'hoy');
    const manana = data.hearings.filter((h) => h.dayLabel === 'mañana');
    const hoy0 = hoy[0];
    if (hoy.length === 1 && hoy0) {
      parts.push(`Tiene una audiencia hoy: ${hoy0.matterTitle} en ${hoy0.venue}.`);
    } else if (hoy.length > 1) {
      parts.push(`Tiene ${hoy.length} audiencias hoy.`);
    }
    const manana0 = manana[0];
    if (manana.length === 1 && manana0) {
      parts.push(`Mañana: ${manana0.matterTitle} en ${manana0.venue}.`);
    } else if (manana.length > 1) {
      parts.push(`Mañana tiene ${manana.length} audiencias programadas.`);
    }
  }

  if (data.novelties.length > 0) {
    const doItems = data.novelties.filter((n) => n.type === 'DO');
    if (doItems.length > 0) {
      const titles = doItems.map((n) => n.title).join(', ');
      parts.push(`El Diario Oficial publicó novedades relevantes: ${titles}.`);
    }
  }

  if (data.urgentDeadlines.length > 0) {
    const proximos = data.urgentDeadlines.filter((d) => d.days_until <= 3);
    if (proximos.length > 0) {
      parts.push(`${proximos.length === 1 ? 'Hay un plazo crítico' : `Hay ${proximos.length} plazos críticos`} esta semana.`);
    } else {
      parts.push(`Tiene ${data.urgentDeadlines.length} plazo${data.urgentDeadlines.length > 1 ? 's' : ''} próximo${data.urgentDeadlines.length > 1 ? 's' : ''} en los próximos 7 días.`);
    }
  }

  if (data.urgentMatters.length > 0) {
    parts.push(`${data.urgentMatters.length === 1 ? 'Un caso de prioridad alta requiere' : `${data.urgentMatters.length} casos de prioridad alta requieren`} atención.`);
  }

  if (parts.length === 0) {
    return 'Todo está al día. No hay audiencias ni plazos urgentes para hoy. ¿En qué quiere trabajar?';
  }

  return parts.join(' ') + ' ¿Por dónde empezamos?';
}

// ─── Función principal ───────────────────────────────────────────────────────

/**
 * Genera el DayBriefingData para la home v2.
 * Se ejecuta en server-side únicamente (RSC o Server Action).
 */
export async function generateDayBriefing(): Promise<DayBriefingData> {
  const [shell, matters] = await Promise.all([
    getCachedShellData(),
    fetchMatters({ limit: 50 }),
  ]);

  const firmId = shell.firm?.firm_id ?? '';
  const userFullName = shell.firm?.user_full_name ?? '';

  const greeting = getGreeting();
  const userName = formatUserName(userFullName);
  const urgentDeadlines = buildUrgentDeadlines(matters);
  const urgentMatters = buildUrgentMatters(matters);
  const hearings = buildHearings(matters);
  const novelties = await fetchNovelties(firmId, matters);

  const partial = {
    greeting,
    userName,
    hearings,
    urgentDeadlines,
    novelties,
    urgentMatters,
    deadlines7dCount: shell.counts.deadlines7d,
  };

  const summary = buildSummary(partial);

  return { ...partial, summary };
}
