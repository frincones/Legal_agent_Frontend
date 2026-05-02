/**
 * Mic capture via AudioWorklet → emits 24 kHz int16 PCM chunks.
 * Caller pipes chunks to the WebSocket relay.
 */

export type PCMChunk = ArrayBuffer;

export class PCMRecorder {
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private listeners = new Set<(chunk: PCMChunk) => void>();

  async start(): Promise<void> {
    if (this.ctx) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });

    this.ctx = new AudioContext({ sampleRate: 48_000, latencyHint: 'interactive' });
    await this.ctx.audioWorklet.addModule('/audio/pcm-recorder-worklet.js');
    this.node = new AudioWorkletNode(this.ctx, 'pcm24k-recorder');
    this.node.port.onmessage = (e) => {
      const chunk = e.data as ArrayBuffer;
      for (const fn of this.listeners) fn(chunk);
    };
    const source = this.ctx.createMediaStreamSource(this.stream);
    source.connect(this.node);
    // Don't connect node to destination — we don't want to play back the mic.
  }

  onChunk(fn: (chunk: PCMChunk) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async stop(): Promise<void> {
    this.node?.disconnect();
    this.node = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    await this.ctx?.close();
    this.ctx = null;
    this.listeners.clear();
  }

  get active(): boolean {
    return this.ctx !== null;
  }
}
