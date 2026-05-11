'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

type RunningEntry = {
  id: string;
  matter_id: string;
  description: string;
  started_at: string;
} | null;

function fmtElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600).toString().padStart(2, '0');
  const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function TimerWidget({
  matterId,
  onChange,
}: {
  matterId: string;
  onChange?: () => void;
}) {
  const [running, setRunning] = useState<RunningEntry>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const tickRef = useRef<number | null>(null);

  async function fetchRunning() {
    try {
      const r = await fetch('/api/time-entries/running', { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        setRunning(d.running);
      }
    } catch {}
  }

  useEffect(() => { void fetchRunning(); }, [matterId]);

  // Tick cada segundo si hay timer activo
  useEffect(() => {
    if (!running) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      setElapsed(0);
      return;
    }
    const startedTs = new Date(running.started_at).getTime();
    const update = () => setElapsed(Date.now() - startedTs);
    update();
    tickRef.current = window.setInterval(update, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running]);

  async function onStart() {
    if (running) return;
    setBusy(true);
    try {
      const r = await fetch('/api/time-entries/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matter_id: matterId, description }),
      });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setRunning({
        id: d.id, matter_id: d.matter_id,
        description: d.description, started_at: d.started_at,
      });
      toast.success('Timer iniciado');
    } catch (e) {
      toast.error('No pude iniciar el timer');
    } finally {
      setBusy(false);
    }
  }

  async function onStop() {
    if (!running) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/time-entries/${running.id}/stop`, { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      toast.success(`Registrado · ${d.duration_min} min`);
      setRunning(null);
      setDescription('');
      onChange?.();
    } catch (e) {
      toast.error('No pude detener el timer');
    } finally {
      setBusy(false);
    }
  }

  const isRunningHere = running?.matter_id === matterId;
  const isRunningElsewhere = running && !isRunningHere;

  return (
    <div className="surface flex items-center gap-3 p-3">
      <div className={`grid h-10 w-10 place-items-center rounded-full ${
        isRunningHere ? 'bg-emerald-500/15 text-emerald-500' : 'bg-bg-sunken text-ink-3'
      }`}>
        {busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> :
         isRunningHere ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
      </div>
      <div className="flex-1 min-w-0">
        {isRunningHere ? (
          <>
            <div className="mono text-[20px] font-semibold tabular-nums">{fmtElapsed(elapsed)}</div>
            <div className="text-[11.5px] muted truncate">{running.description || 'Trabajando…'}</div>
          </>
        ) : isRunningElsewhere ? (
          <>
            <div className="text-[12.5px] muted">Timer activo en otro caso ({fmtElapsed(elapsed)})</div>
          </>
        ) : (
          <input
            type="text"
            placeholder="Describe lo que estás trabajando…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent text-[13px] outline-none"
          />
        )}
      </div>
      {isRunningHere ? (
        <button className="btn btn-primary" onClick={onStop} disabled={busy}>
          <Pause size={12} aria-hidden="true" /> Detener
        </button>
      ) : (
        <button className="btn btn-primary" onClick={onStart} disabled={busy || !!isRunningElsewhere}>
          <Play size={12} aria-hidden="true" /> Iniciar
        </button>
      )}
    </div>
  );
}
