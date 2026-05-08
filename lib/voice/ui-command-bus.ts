'use client';

/**
 * F1 · UICommandBus
 *
 * Singleton in-memory bus que recibe comandos `ui.command` del agente de voz
 * (vía RealtimeClient → relay backend) y los despacha a handlers registrados
 * por VoiceProvider, páginas, formularios, etc.
 *
 * Patrón: cualquier componente puede `register(action, handler)` durante su
 * mount y `unregister(action, handler)` en cleanup. Los handlers se ejecutan
 * en orden de registro; el primero que retorne `true` consume el comando.
 *
 * Forms exponen su API imperativa registrando bajo `prefill_form:<name>`.
 */

export type UICommand =
  | { action: 'navigate'; path: string }
  | { action: 'open_matter_tab'; matter_id: string; tab: string }
  | { action: 'scroll_to'; target: string }
  | { action: 'open_command_palette'; initial_query?: string }
  | { action: 'prefill_form'; form: string; values: Record<string, unknown>; submit?: boolean }
  | { action: 'toast'; message: string; variant?: 'info' | 'success' | 'warning' | 'error' }
  | { action: 'open_modal'; title: string; body: string; confirm_label?: string; cancel_label?: string }
  // Canvas operations · ejecutadas por CanvasEditor.registerCanvasApi
  | { action: 'canvas_get_current' }
  | { action: 'canvas_set_text'; markdown: string }
  | { action: 'canvas_append'; markdown: string }
  | { action: 'canvas_replace_section'; heading: string; markdown: string }
  | { action: 'canvas_insert_at_cursor'; markdown: string }
  | { action: 'canvas_find_replace'; needle: string; replacement: string }
  | { action: 'canvas_select_section'; heading: string }
  | { action: 'canvas_save_version' };

export type CanvasApi = {
  get_current: () => { text: string; html: string; markdown: string; word_count: number };
  set_text: (markdown: string) => void;
  append: (markdown: string) => void;
  replace_section: (heading: string, markdown: string) => void;
  insert_at_cursor: (markdown: string) => void;
  find_replace: (needle: string, replacement: string) => { count: number };
  select_section: (heading: string) => { found: boolean };
  save_version: () => Promise<void>;
};

export type UIHandler = (command: UICommand) => boolean | Promise<boolean>;

type FormApi = {
  setValues: (partial: Record<string, unknown>) => void;
  submit?: () => void | Promise<void>;
};

class UICommandBusImpl {
  private handlers: Map<string, Set<UIHandler>> = new Map();
  private formApis: Map<string, FormApi> = new Map();
  private canvasApi: CanvasApi | null = null;

  /** Registra un handler para un action específico. Devuelve la función de unregister. */
  register(action: UICommand['action'], handler: UIHandler): () => void {
    if (!this.handlers.has(action)) this.handlers.set(action, new Set());
    this.handlers.get(action)!.add(handler);
    return () => this.unregister(action, handler);
  }

  unregister(action: UICommand['action'], handler: UIHandler): void {
    this.handlers.get(action)?.delete(handler);
  }

  /** Forms registran su API imperativa para que ui_prefill_form la use. */
  registerForm(name: string, api: FormApi): () => void {
    this.formApis.set(name, api);
    return () => {
      if (this.formApis.get(name) === api) this.formApis.delete(name);
    };
  }

  getFormApi(name: string): FormApi | undefined {
    return this.formApis.get(name);
  }

  /** El CanvasEditor registra su API imperativa al montar. */
  registerCanvasApi(api: CanvasApi): () => void {
    this.canvasApi = api;
    return () => {
      if (this.canvasApi === api) this.canvasApi = null;
    };
  }

  getCanvasApi(): CanvasApi | null {
    return this.canvasApi;
  }

  /** Despacha el comando al primer handler que lo consuma (true). */
  async dispatch(command: UICommand): Promise<boolean> {
    const set = this.handlers.get(command.action);
    if (!set || set.size === 0) {
      console.warn('[UICommandBus] no handler for action', command.action, command);
      return false;
    }
    for (const handler of set) {
      try {
        const consumed = await handler(command);
        if (consumed) return true;
      } catch (e) {
        console.error('[UICommandBus] handler error', command.action, e);
      }
    }
    return false;
  }
}

export const uiCommandBus = new UICommandBusImpl();
