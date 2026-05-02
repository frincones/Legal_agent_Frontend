/**
 * Plays a queue of 24 kHz int16 PCM audio chunks coming from the
 * Realtime relay. Uses Web Audio scheduled buffers (AudioBuffer +
 * AudioBufferSourceNode). On `flush()` (barge-in), it cancels all
 * future scheduled sources to silence TTS within ~5 ms.
 */

const TARGET_SR = 24_000;

export class PCMPlayer {
  private ctx: AudioContext | null = null;
  private nextStart = 0;
  private active = new Set<AudioBufferSourceNode>();

  ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: TARGET_SR, latencyHint: 'interactive' });
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  enqueue(pcm16: ArrayBuffer): void {
    const ctx = this.ensureCtx();
    const view = new Int16Array(pcm16);
    if (view.length === 0) return;

    const buf = ctx.createBuffer(1, view.length, TARGET_SR);
    const out = buf.getChannelData(0);
    for (let i = 0; i < view.length; i++) {
      const sample = view[i] ?? 0;
      out[i] = sample / 0x8000;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    const start = Math.max(this.nextStart, now);
    src.start(start);
    this.nextStart = start + buf.duration;
    this.active.add(src);
    src.onended = () => {
      this.active.delete(src);
    };
  }

  flush(): void {
    for (const s of this.active) {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    }
    this.active.clear();
    if (this.ctx) this.nextStart = this.ctx.currentTime;
  }

  async close(): Promise<void> {
    this.flush();
    await this.ctx?.close();
    this.ctx = null;
    this.nextStart = 0;
  }
}
