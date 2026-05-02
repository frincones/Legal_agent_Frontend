/**
 * AudioWorklet · downsamples mic input to 24 kHz mono int16 PCM and posts
 * each chunk to the main thread. OpenAI Realtime expects this format.
 *
 * Browsers run AudioContext at 48 kHz by default; we drop every other
 * sample (cheap linear decimation) — adequate for speech in this band.
 */
class PCM24kRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buf = new Int16Array(4096);
    this._bufIdx = 0;
    this._sampleSkip = 1;  // 0 = take, 1 = skip — toggles for /2 downsample
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      // Decimate 48 kHz -> 24 kHz
      this._sampleSkip ^= 1;
      if (this._sampleSkip) continue;

      // Float32 [-1,1] -> int16
      let s = channel[i];
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      this._buf[this._bufIdx++] = s < 0 ? s * 0x8000 : s * 0x7fff;

      if (this._bufIdx >= this._buf.length) {
        this.port.postMessage(this._buf.slice(0, this._bufIdx).buffer, [
          this._buf.slice(0, this._bufIdx).buffer,
        ]);
        this._bufIdx = 0;
      }
    }
    return true;
  }
}

registerProcessor('pcm24k-recorder', PCM24kRecorderProcessor);
