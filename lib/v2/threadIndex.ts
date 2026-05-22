/**
 * lib/v2/threadIndex.ts
 *
 * Indice local de hilos (threads) por usuario. Se persiste en localStorage
 * porque el backend de LexAI no expone (al dia de hoy) un endpoint que
 * agrupe skill_executions por session_id ni devuelva el prompt para
 * titular el hilo. Aqui replicamos esa funcionalidad client-side de forma
 * estable: cada thread tiene un session_id (mismo UUID que se envia al
 * backend en cada turno), un titulo (primer prompt), un timestamp y un
 * contador de mensajes.
 *
 * Cada entrada se persiste en la clave `lexai-v2-thread-index`.
 * Los mensajes del hilo viven en `lexai-v2-current-thread:<session_id>`
 * cuando se "abre" un hilo, o en `lexai-v2-current-thread` (sin sufijo)
 * para el hilo activo principal.
 *
 * Notas:
 *  - Es per-browser (no se sincroniza entre dispositivos).
 *  - Si el usuario limpia el localStorage pierde la lista.
 *  - Cuando el backend exponga GET /v1/threads con session_id + title +
 *    last_message_at, se puede reemplazar este indice por la respuesta del
 *    backend sin tocar la UI (mantener el mismo shape).
 */

export interface ThreadIndexEntry {
  /** UUID estable del hilo · igual al session_id que se envia al backend. */
  session_id: string;
  /** Titulo (primer prompt del usuario, truncado). */
  title: string;
  /** ISO timestamp del ultimo mensaje. Sirve para ordenar y agrupar. */
  last_message_at: string;
  /** Cuantos turnos hay en el hilo (user+assistant). */
  message_count: number;
  /** Opcional: matter_id si el hilo esta ligado a un caso. */
  matter_id?: string | null;
}

const INDEX_KEY = 'lexai-v2-thread-index';
const MAX_TITLE_LEN = 60;
const MAX_INDEX_ENTRIES = 100;

/** Lee el indice desde localStorage. Devuelve [] si no existe o es invalido. */
export function readThreadIndex(): ThreadIndexEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is ThreadIndexEntry =>
      typeof e?.session_id === 'string' &&
      typeof e?.title === 'string' &&
      typeof e?.last_message_at === 'string',
    );
  } catch {
    return [];
  }
}

/** Persiste el indice (sobrescribe). Recorta a MAX_INDEX_ENTRIES mas recientes. */
function writeThreadIndex(entries: ThreadIndexEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = entries
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      .slice(0, MAX_INDEX_ENTRIES);
    localStorage.setItem(INDEX_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota exceeded — noop */
  }
}

/**
 * Upsert: crea o actualiza una entrada del indice tras un turno completado.
 * Si la entrada existe, solo actualiza last_message_at + message_count (el
 * titulo se mantiene del primer prompt). Si es nueva, usa firstPrompt como
 * titulo.
 */
export function upsertThread(params: {
  session_id: string;
  firstPrompt: string;
  matter_id?: string | null;
  messageCount: number;
}): ThreadIndexEntry {
  const { session_id, firstPrompt, matter_id, messageCount } = params;
  const now = new Date().toISOString();
  const all = readThreadIndex();
  const idx = all.findIndex((e) => e.session_id === session_id);

  if (idx >= 0) {
    const updated: ThreadIndexEntry = {
      ...all[idx],
      last_message_at: now,
      message_count: messageCount,
      matter_id: matter_id ?? all[idx].matter_id ?? null,
    };
    all[idx] = updated;
    writeThreadIndex(all);
    return updated;
  }

  const safeTitle = (firstPrompt || 'Hilo sin titulo').trim();
  const title = safeTitle.length > MAX_TITLE_LEN
    ? `${safeTitle.slice(0, MAX_TITLE_LEN - 3)}...`
    : safeTitle;
  const entry: ThreadIndexEntry = {
    session_id,
    title,
    last_message_at: now,
    message_count: messageCount,
    matter_id: matter_id ?? null,
  };
  all.push(entry);
  writeThreadIndex(all);
  return entry;
}

/** Borra una entrada del indice (no toca los mensajes persistidos del hilo). */
export function removeThread(session_id: string): void {
  const all = readThreadIndex().filter((e) => e.session_id !== session_id);
  writeThreadIndex(all);
}

/** Borra el indice entero (todos los hilos). */
export function clearThreadIndex(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(INDEX_KEY);
  } catch {
    /* noop */
  }
}
