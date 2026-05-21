'use client';

/**
 * F3-T04 · LexAI UX v2 — VoiceRecorder
 *
 * Captura de audio via MediaRecorder + waveform animado estilo Claude.
 * Usa Web Audio API (AudioContext + AnalyserNode) para las barras de amplitud.
 *
 * Estados:
 *   - idle: botón circular con icono Mic
 *   - recording: waveform animado (30 barras) + timer mm:ss + botones X / check
 *
 * Al confirmar: intenta transcribir via /api/voice/transcribe (si existe).
 * Si el endpoint falla o no existe → inserta placeholder con TODO.
 * Si falla la transcripción → onError() con mensaje.
 *
 * Flag: NEXT_PUBLIC_UX_V2_COMPOSER
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  /** Llamado cuando el usuario confirma y la transcripción está lista. */
  onTranscript: (text: string) => void;
  /** Estado desde afuera — si el composer está deshabilitado. */
  disabled?: boolean;
  /** Callback cuando empieza a grabar (para que ComposerV2 oculte el textarea). */
  onRecordingStart?: () => void;
  /** Callback cuando termina (cancelado o confirmado). */
  onRecordingEnd?: () => void;
  /**
   * Si true, inicia la grabación automáticamente al montar el componente.
   * Usado cuando el botón Mic del toolbar activa el estado voiceRecording
   * y el waveform se monta ya en modo grabando.
   */
  startOnMount?: boolean;
}

const BAR_COUNT = 30;

export function VoiceRecorder({
  onTranscript,
  disabled,
  onRecordingStart,
  onRecordingEnd,
  startOnMount = false,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0); // segundos
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopEverything = useCallback(() => {
    // Stop animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // Stop audio context
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setBars(Array(BAR_COUNT).fill(0));
    setElapsed(0);
    setRecording(false);
    onRecordingEnd?.();
  }, [onRecordingEnd]);

  // Cleanup on unmount
  useEffect(() => () => { stopEverything(); }, [stopEverything]);

  // Auto-start si startOnMount=true (montado ya en modo grabando)
  useEffect(() => {
    if (startOnMount && !disabled) {
      void startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  const animateWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    // Map frequency data to BAR_COUNT bars
    const step = Math.floor(data.length / BAR_COUNT);
    const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
      const start = i * step;
      const slice = data.slice(start, start + step);
      const avg = slice.reduce((s, v) => s + v, 0) / (slice.length || 1);
      return avg / 255; // normalize 0-1
    });
    setBars(newBars);
    animFrameRef.current = requestAnimationFrame(animateWaveform);
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio API for waveform
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      // MediaRecorder for audio data
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = mr;
      mr.start(100); // slice each 100ms

      // Timer
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

      // Waveform animation
      animFrameRef.current = requestAnimationFrame(animateWaveform);

      setRecording(true);
      onRecordingStart?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error de micrófono';
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        toast.error('Permiso de micrófono denegado. Actívalo en la barra del navegador.');
      } else {
        toast.error(`No se pudo iniciar la grabación: ${msg}`);
      }
    }
  }, [disabled, animateWaveform, onRecordingStart]);

  const cancelRecording = useCallback(() => {
    chunksRef.current = [];
    stopEverything();
  }, [stopEverything]);

  const confirmRecording = useCallback(async () => {
    // Collect chunks before stopping
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Wait for ondataavailable to fire
      await new Promise<void>((resolve) => {
        const mr = mediaRecorderRef.current!;
        mr.onstop = () => resolve();
      });
    }

    const chunks = chunksRef.current;
    chunksRef.current = [];
    stopEverything();

    if (chunks.length === 0) {
      toast.warning('No se capturó audio. Intenta grabar de nuevo.');
      return;
    }

    const blob = new Blob(chunks, { type: 'audio/webm' });

    // Attempt transcription via backend
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = (await res.json()) as { text?: string };
        if (json.text && json.text.trim()) {
          onTranscript(json.text.trim());
          return;
        }
      }
      // Endpoint returned non-ok or no text
      // TODO: implementar endpoint /api/voice/transcribe → /v1/voice/transcribe en backend
      toast.warning('Transcripción no disponible. El texto de audio será procesado cuando el backend lo soporte.');
      onTranscript('[Audio grabado — transcripción pendiente]');
    } catch {
      // TODO: endpoint /api/voice/transcribe no existe aún
      toast.warning('El endpoint de transcripción no está disponible todavía.');
      onTranscript('[Audio grabado — transcripción pendiente]');
    }
  }, [stopEverything, onTranscript]);

  // Format elapsed time as mm:ss
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ─── Recording UI ─────────────────────────────────────────────────────────
  if (recording) {
    return (
      <div
        className="flex items-center gap-3"
        role="region"
        aria-label="Grabación de voz activa"
        aria-live="polite"
      >
        {/* Cancel */}
        <button
          type="button"
          onClick={cancelRecording}
          aria-label="Cancelar grabación"
          className={[
            'flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full',
            'bg-[color:var(--v2-bg-muted,#E8E7E1)] text-[color:var(--v2-text-secondary,#4A4944)]',
            'hover:bg-red-50 hover:text-red-600',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
            'transition-colors duration-150',
          ].join(' ')}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        {/* Waveform */}
        <div
          className="flex flex-1 items-end justify-center gap-[2px] h-[32px]"
          aria-hidden
        >
          {bars.map((amplitude, i) => {
            const height = Math.max(3, amplitude * 28); // 3px min, 28px max
            return (
              <span
                key={i}
                className="rounded-full transition-none"
                style={{
                  width: '2px',
                  height: `${height}px`,
                  background: 'var(--v2-accent-copper, #B8763C)',
                  opacity: 0.7 + amplitude * 0.3,
                }}
              />
            );
          })}
        </div>

        {/* Timer */}
        <span
          className="shrink-0 text-[12px] font-mono font-medium text-[color:var(--v2-text-secondary,#4A4944)] tabular-nums"
          aria-label={`Tiempo grabado: ${formatTime(elapsed)}`}
        >
          {formatTime(elapsed)}
        </span>

        {/* Confirm */}
        <button
          type="button"
          onClick={confirmRecording}
          aria-label="Confirmar grabación y transcribir"
          className={[
            'flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full',
            'bg-[color:var(--v2-accent-copper,#B8763C)] text-white',
            'hover:bg-[color:var(--v2-accent-copper-hover,#a16732)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--v2-accent-copper,#B8763C)]',
            'transition-colors duration-150',
          ].join(' ')}
        >
          <Check className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  // ─── Idle UI ──────────────────────────────────────────────────────────────
  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      aria-label="Iniciar grabación de voz"
      className={[
        'flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full',
        'text-[color:var(--v2-text-secondary,#4A4944)]',
        'hover:bg-[color:var(--v2-bg-subtle,#F2F1EC)] hover:text-[color:var(--v2-text-primary,#1A1916)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--v2-accent-copper,#B8763C)]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'transition-colors duration-150',
      ].join(' ')}
    >
      <Mic className="h-4 w-4" aria-hidden />
    </button>
  );
}
