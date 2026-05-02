/**
 * OpenAI Realtime client (browser) ↔ Railway WS relay.
 *
 * - Captures mic via PCMRecorder, streams chunks as binary to Railway.
 * - Receives binary PCM16 24 kHz from Railway, plays via PCMPlayer.
 * - Listens for control events to drive the Voice HUD state machine.
 * - Barge-in: when user starts speaking while assistant is talking,
 *   sends `response.cancel` exactly ONCE (guarded by speaking flag) and
 *   flushes the player → assistant goes silent in <100 ms.
 */

import { useVoiceStore } from '@/lib/stores/voice-store';
import { PCMRecorder } from '@/lib/voice/PCMRecorder';
import { PCMPlayer } from '@/lib/voice/PCMPlayer';

export type RealtimeOptions = {
  ticket: string;
  wsUrl?: string;
  onError?: (e: { code?: string | number; message: string }) => void;
};

const THINKING_TIMEOUT_MS = 8_000;

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private opts: RealtimeOptions;
  private connected = false;
  private recorder = new PCMRecorder();
  private player = new PCMPlayer();
  private speaking = false;
  private cancelInFlight = false;
  private thinkingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: RealtimeOptions) {
    this.opts = opts;
  }

  async connect(): Promise<void> {
    const wsUrl =
      this.opts.wsUrl ??
      process.env.NEXT_PUBLIC_RAILWAY_WS ??
      'ws://localhost:8000/v1/voice/ws';
    const url = `${wsUrl}?ticket=${encodeURIComponent(this.opts.ticket)}`;
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => {
        this.connected = true;
        resolve();
      };
      ws.onmessage = (e) => this.onMessage(e);
      ws.onerror = () => {
        this.opts.onError?.({ code: 'ws_error', message: 'WebSocket error' });
        if (!this.connected) reject(new Error('WebSocket failed to open'));
      };
      ws.onclose = () => {
        this.connected = false;
        this.clearThinkingTimer();
        useVoiceStore.getState().setState('idle');
      };
      this.ws = ws;
    });
  }

  /** Start mic + start streaming audio to Railway. */
  async startListening(): Promise<void> {
    if (!this.recorder.active) await this.recorder.start();
    this.recorder.onChunk((chunk) => {
      // Audio chunks are streamed as-is. Barge-in is handled by the
      // VAD event from the relay (vad.user_started), NOT per-chunk —
      // sending response.cancel on every 40ms chunk produced spurious
      // "no active response" errors from OpenAI.
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(chunk);
      }
    });
    useVoiceStore.getState().setState('listening');
  }

  async stopListening(): Promise<void> {
    await this.recorder.stop();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
    }
  }

  private onMessage(e: MessageEvent): void {
    const store = useVoiceStore.getState();
    if (typeof e.data !== 'string') {
      // Binary PCM16 24kHz from OpenAI → enqueue
      this.player.enqueue(e.data);
      this.speaking = true;
      this.clearThinkingTimer();
      if (store.state !== 'speaking') store.setState('speaking');
      return;
    }
    let msg: { type: string } & Record<string, unknown>;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'session.ready':
        store.setState('idle');
        break;
      case 'vad.user_started':
        // Only request cancel if assistant is currently speaking AND we
        // haven't already sent one; cancelInFlight clears on speak.cancelled.
        if (this.speaking && !this.cancelInFlight) {
          this.player.flush();
          this.bargeinCommit();
          store.bumpBargein();
        }
        store.setState('listening');
        break;
      case 'vad.user_stopped':
        // wait for transcript.final → 'thinking'
        break;
      case 'transcript.partial':
        store.setPartial((msg.text as string) ?? '');
        break;
      case 'transcript.final':
        store.setTranscript((msg.text as string) ?? '');
        store.setState('thinking');
        this.armThinkingTimer();
        break;
      case 'tool.started':
        this.clearThinkingTimer();
        store.pushTool({
          id: msg.id as string,
          name: msg.name as string,
          status: 'started',
          preview: msg.preview,
        });
        store.setState('tool');
        break;
      case 'tool.finished':
        store.pushTool({
          id: msg.id as string,
          name: (msg.name as string) ?? '',
          status: 'finished',
          ms: msg.ms as number,
        });
        // If model is still working we re-arm; speak.start will clear.
        this.armThinkingTimer();
        break;
      case 'answer.text.delta':
        store.appendAnswer((msg.text as string) ?? '');
        break;
      case 'speak.start':
        this.speaking = true;
        this.cancelInFlight = false;
        this.clearThinkingTimer();
        store.setState('speaking');
        break;
      case 'speak.end':
        this.speaking = false;
        this.cancelInFlight = false;
        store.setState('idle');
        break;
      case 'speak.cancelled':
        this.speaking = false;
        this.cancelInFlight = false;
        this.player.flush();
        store.bumpBargein();
        store.setState('listening');
        break;
      case 'hitl.requested':
        store.setState('awaiting');
        store.setCaption(`HITL: ${msg.kind}`);
        break;
      case 'hitl.resolved':
        store.setCaption('');
        break;
      case 'error': {
        const code = msg.code as string | number | undefined;
        const message = (msg.message as string) ?? 'unknown error';
        // Suppress "no active response" — caused by a race between a
        // barge-in and OpenAI's own response.done. It's benign, the user
        // already got the desired silence via player.flush().
        if (
          typeof message === 'string' &&
          /no active response|cancellation failed/i.test(message)
        ) {
          this.cancelInFlight = false;
          break;
        }
        this.opts.onError?.({ code, message });
        break;
      }
      default:
        break;
    }
  }

  private armThinkingTimer(): void {
    this.clearThinkingTimer();
    this.thinkingTimer = setTimeout(() => {
      const s = useVoiceStore.getState();
      if (s.state === 'thinking' || s.state === 'tool') {
        s.setState('idle');
        s.setCaption('');
      }
      this.thinkingTimer = null;
    }, THINKING_TIMEOUT_MS);
  }

  private clearThinkingTimer(): void {
    if (this.thinkingTimer) {
      clearTimeout(this.thinkingTimer);
      this.thinkingTimer = null;
    }
  }

  bargeinCommit(): void {
    if (this.cancelInFlight) {
      // Still send buffer commit so the user's speech reaches the model,
      // but don't re-cancel the response.
      this.sendControl({ type: 'input_audio_buffer.commit', reason: 'bargein' });
      return;
    }
    this.cancelInFlight = true;
    this.sendControl({ type: 'response.cancel' });
    this.sendControl({ type: 'input_audio_buffer.commit', reason: 'bargein' });
  }

  cancel(): void {
    if (this.cancelInFlight || !this.speaking) return;
    this.cancelInFlight = true;
    this.sendControl({ type: 'response.cancel' });
  }

  private sendControl(obj: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(obj));
  }

  async close(): Promise<void> {
    this.clearThinkingTimer();
    await this.recorder.stop();
    await this.player.close();
    this.ws?.close();
    this.ws = null;
    this.connected = false;
    this.speaking = false;
    this.cancelInFlight = false;
  }
}
