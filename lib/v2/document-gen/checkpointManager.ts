/**
 * lib/v2/document-gen/checkpointManager.ts
 *
 * Sistema de checkpoints en localStorage para proteger edits del usuario
 * antes de operaciones destructivas (canvas_replace_section, regenerate).
 *
 * Cada checkpoint guarda:
 *  - timestamp
 *  - triggerReason (por que se creo)
 *  - contentJson (TipTap JSON serializado)
 *  - userNote (opcional)
 *
 * Limite: 10 checkpoints por documento (FIFO).
 * Storage: localStorage clave `lexai-v2-canvas-checkpoints:<docId>`.
 */

export type CheckpointReason =
  | 'pre_regenerate'
  | 'pre_replace'
  | 'pre_critique'
  | 'manual'
  | 'auto_periodic';

export interface Checkpoint {
  /** UUID del checkpoint. */
  id: string;
  /** ID del documento al que pertenece. */
  docId: string;
  /** Epoch ms. */
  timestamp: number;
  /** Motivo de creacion. */
  triggerReason: CheckpointReason;
  /** Snapshot del TipTap editor.getJSON(). */
  contentJson: object;
  /** Nota opcional del usuario. */
  userNote?: string;
}

const MAX_CHECKPOINTS_PER_DOC = 10;

function keyFor(docId: string): string {
  return `lexai-v2-canvas-checkpoints:${docId}`;
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `cp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const checkpointManager = {
  /**
   * Crea un checkpoint pre-operacion. Devuelve el checkpoint creado.
   * Limita a MAX_CHECKPOINTS_PER_DOC mas recientes (FIFO).
   */
  save(docId: string, contentJson: object, reason: CheckpointReason, userNote?: string): Checkpoint {
    const cp: Checkpoint = {
      id: genId(),
      docId,
      timestamp: Date.now(),
      triggerReason: reason,
      contentJson,
      userNote,
    };
    const list = this.list(docId);
    list.unshift(cp);
    const trimmed = list.slice(0, MAX_CHECKPOINTS_PER_DOC);
    try {
      localStorage.setItem(keyFor(docId), JSON.stringify(trimmed));
    } catch {
      /* quota exceeded — noop */
    }
    return cp;
  },

  /** Lista todos los checkpoints del doc, mas recientes primero. */
  list(docId: string): Checkpoint[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(keyFor(docId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /** Recupera un checkpoint especifico por id. */
  get(docId: string, checkpointId: string): Checkpoint | null {
    return this.list(docId).find((c) => c.id === checkpointId) ?? null;
  },

  /** Devuelve el checkpoint mas reciente del documento. */
  latest(docId: string): Checkpoint | null {
    return this.list(docId)[0] ?? null;
  },

  /** Elimina un checkpoint puntual. */
  remove(docId: string, checkpointId: string): void {
    const list = this.list(docId).filter((c) => c.id !== checkpointId);
    try {
      localStorage.setItem(keyFor(docId), JSON.stringify(list));
    } catch {
      /* noop */
    }
  },

  /** Elimina todos los checkpoints del documento. */
  clear(docId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(keyFor(docId));
    } catch {
      /* noop */
    }
  },
};
