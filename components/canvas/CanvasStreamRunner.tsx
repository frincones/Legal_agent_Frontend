'use client';

/**
 * Sprint G · CanvasStreamRunner
 *
 * Detecta si hay un skill encolado en sessionStorage['lexai.canvas.stream']
 * y, una vez el editor está montado (CanvasApi registrado), abre el SSE
 * /api/skills/execute/stream y aplica cada delta al editor vía
 * uiCommandBus.stream_set_text. Al recibir 'done' guarda versión y muestra
 * resumen.
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { uiCommandBus } from '@/lib/voice/ui-command-bus';

const SESSION_KEY = 'lexai.canvas.stream';

export type StreamSeed = {
  command: string;
  matterId: string;
  matterTitulo?: string;
  prompt: string;
  skillName?: string;
};

type Phase = 'idle' | 'connecting' | 'streaming' | 'finishing' | 'done' | 'error';

export function CanvasStreamRunner({ matterId }: { matterId: string }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [meta, setMeta] = useState<{ skill?: string } | null>(null);
  const [warnings, setWarnings] = useState<Array<{ hook?: string; reason?: string }>>([]);
  const [tokens, setTokens] = useState<{ input: number; output: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null;
    if (!raw) return;
    let seed: StreamSeed | null = null;
    try {
      seed = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    if (!seed || seed.matterId !== matterId) return;
    startedRef.current = true;
    sessionStorage.removeItem(SESSION_KEY);

    const seedFinal = seed; // type-narrow for closure

    // Esperar a que el editor registre su API (typically ~200-500ms tras mount).
    let attempts = 0;
    const maxAttempts = 60;
    const tryStart = async () => {
      const api = uiCommandBus.getCanvasApi();
      if (!api?.stream_set_text) {
        attempts++;
        if (attempts > maxAttempts) {
          setPhase('error');
          setErrorMsg('Editor no se montó a tiempo');
          return;
        }
        setTimeout(tryStart, 100);
        return;
      }
      await runStream(seedFinal, api);
    };
    void tryStart();
  }, [matterId]);

  async function runStream(
    seed: StreamSeed,
    api: NonNullable<ReturnType<typeof uiCommandBus.getCanvasApi>>,
  ) {
    setPhase('connecting');
    setMeta({ skill: seed.skillName || seed.command });
    let buffer = '';

    try {
      const res = await fetch('/api/skills/execute/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: seed.command,
          matter_id: seed.matterId,
          input: {
            matter_titulo: seed.matterTitulo,
            prompt: seed.prompt,
          },
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      setPhase('streaming');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let leftover = '';
      let lastFlush = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        leftover += decoder.decode(value, { stream: true });
        // SSE events separated by \n\n
        const parts = leftover.split('\n\n');
        leftover = parts.pop() ?? '';
        for (const block of parts) {
          if (!block.trim()) continue;
          let event = 'message';
          let dataLines: string[] = [];
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
          }
          if (!dataLines.length) continue;
          let data: any = null;
          try {
            data = JSON.parse(dataLines.join('\n'));
          } catch {
            continue;
          }
          if (event === 'meta') {
            setMeta({ skill: data.name || seed.command });
          } else if (event === 'delta') {
            buffer += data.text || '';
            const now = Date.now();
            // Throttle a 40ms para no saturar TipTap pero seguir fluido
            if (now - lastFlush > 40 || buffer.length < 200) {
              api.stream_set_text!(buffer);
              lastFlush = now;
            }
          } else if (event === 'warning') {
            setWarnings((w) => [...w, { hook: data.hook, reason: data.reason }]);
          } else if (event === 'blocked') {
            throw new Error(`Bloqueado por hook ${data.hook}: ${data.reason}`);
          } else if (event === 'done') {
            // Flush final
            if (data.full_text) {
              api.stream_set_text!(data.full_text);
            } else {
              api.stream_set_text!(buffer);
            }
            setTokens(data.tokens || null);
            setPhase('finishing');
            api.stream_finish?.();
            // Guardar versión persistente
            try {
              await api.save_version();
            } catch (e) {
              console.warn('save_version after stream failed', e);
            }
            setPhase('done');
            toast.success('Documento generado', {
              description: `${data.tokens?.output ?? 0} tokens · ${Math.round((data.duration_ms ?? 0) / 100) / 10}s`,
            });
            return;
          } else if (event === 'error') {
            throw new Error(data.detail || data.error || 'stream error');
          }
        }
      }
      // Stream terminó sin 'done'
      if (buffer) api.stream_set_text!(buffer);
      api.stream_finish?.();
      setPhase('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error de streaming';
      console.error('[CanvasStreamRunner]', e);
      setErrorMsg(msg);
      setPhase('error');
      api.stream_finish?.();
      toast.error('Streaming falló', { description: msg });
    }
  }

  if (phase === 'idle' || phase === 'done') {
    if (warnings.length === 0) return null;
    return (
      <div className="mx-3 mt-2 rounded-md border-l-2 border-warn bg-warn-soft px-3 py-2 text-[12px]">
        <div className="mb-1 flex items-center gap-1 font-semibold text-warn">
          <AlertTriangle size={12} /> {warnings.length} advertencia(s) del playbook
        </div>
        <ul className="ml-4 list-disc">
          {warnings.map((w, i) => (
            <li key={i}>
              <strong>{w.hook}:</strong> {w.reason}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-2 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-[12px]">
      {phase === 'error' ? (
        <>
          <AlertTriangle size={12} className="text-bad" />
          <span className="text-bad">Streaming falló: {errorMsg}</span>
        </>
      ) : phase === 'finishing' ? (
        <>
          <CheckCircle2 size={12} className="text-ok" />
          <span>Finalizando y guardando versión…</span>
        </>
      ) : (
        <>
          <Loader2 size={12} className="animate-spin text-accent" />
          <Sparkles size={12} className="text-accent" />
          <span>
            LexAI redactando{meta?.skill ? ` · ${meta.skill}` : ''}…
            {tokens && <span className="ml-2 muted">{tokens.output} tokens</span>}
          </span>
        </>
      )}
    </div>
  );
}
