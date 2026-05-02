/**
 * Picovoice Porcupine wake-word stub.
 *
 * Production: install `@picovoice/porcupine-web` and the LexAI custom
 * keyword .ppn file (trained for "Hola LexAI" 5 syllables).
 *
 * Sprint 2 ships with push-to-talk (Spacebar) only. Wake word is
 * Sprint 6 hardening since:
 *   1. Picovoice license key needs to be allocated.
 *   2. The .ppn keyword file needs to be trained / purchased.
 *   3. The WASM bundle is ~700 kB; should be loaded via dynamic import
 *      to keep first-paint bundle under 180 kB.
 *
 * Once the .ppn is in /public/porcupine/hola-lexai.ppn, this module
 * loads the WASM SDK lazily and emits 'wake' events the VoiceProvider
 * picks up to trigger pttDown().
 */

export type WakeWordEngine = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  onWake: (cb: () => void) => () => void;
};

/** Returns null when Picovoice is not configured (dev / no license). */
export async function loadWakeWord(): Promise<WakeWordEngine | null> {
  const accessKey = process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY;
  if (!accessKey || typeof window === 'undefined') return null;

  // Sprint 6: dynamic import the actual SDK + load /porcupine/hola-lexai.ppn
  // const { PorcupineWorker } = await import('@picovoice/porcupine-web');
  // const worker = await PorcupineWorker.create(accessKey, [{...}], handler);
  // return { start, stop, onWake };

  return null;
}
