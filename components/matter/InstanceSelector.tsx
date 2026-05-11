'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const INSTANCE_LABELS: Record<string, string> = {
  inicial: 'Inicial',
  administrativa: 'Vía administrativa',
  primera: 'Primera instancia',
  apelacion: 'Apelación',
  casacion: 'Casación',
  firme: 'Firme',
};

const INSTANCE_ORDER = ['inicial','administrativa','primera','apelacion','casacion','firme'] as const;
type Instance = (typeof INSTANCE_ORDER)[number];

/**
 * Compact dropdown to set/change the procedural instance of a matter.
 * Calls PATCH /api/matters/{id} with `{ instance }` and refreshes RSC.
 */
export function InstanceSelector({
  matterId,
  initialInstance,
}: {
  matterId: string;
  initialInstance?: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Instance>((initialInstance as Instance) ?? 'inicial');
  const [busy, setBusy] = useState(false);

  const onChange = useCallback(
    async (next: Instance) => {
      if (next === value) return;
      const previous = value;
      setValue(next);
      setBusy(true);
      try {
        const res = await fetch(`/api/matters/${encodeURIComponent(matterId)}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ instance: next }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text.slice(0, 200) || `Error ${res.status}`);
        }
        toast.success(`Instancia: ${INSTANCE_LABELS[next]}`);
        router.refresh();
      } catch (e) {
        setValue(previous);
        toast.error(e instanceof Error ? e.message : 'No se pudo actualizar la instancia');
      } finally {
        setBusy(false);
      }
    },
    [matterId, router, value],
  );

  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-line bg-bg-elev px-2 py-1 text-[11.5px]">
      <span className="muted">Instancia:</span>
      <select
        value={value}
        onChange={(e) => void onChange(e.target.value as Instance)}
        disabled={busy}
        className="bg-transparent font-medium outline-none focus:text-accent"
        aria-label="Instancia procesal"
      >
        {INSTANCE_ORDER.map((id) => (
          <option key={id} value={id}>{INSTANCE_LABELS[id]}</option>
        ))}
      </select>
      {busy ? (
        <Loader2 size={11} className="animate-spin text-ink-3" aria-hidden="true" />
      ) : (
        <Check size={11} className="text-emerald-500" aria-hidden="true" />
      )}
    </label>
  );
}

/** Read-only badge for displaying instance in case cards. */
export function InstanceBadge({ instance }: { instance?: string | null }) {
  const label = INSTANCE_LABELS[instance ?? 'inicial'] ?? instance ?? '—';
  const tone =
    instance === 'casacion'
      ? 'chip-red'
      : instance === 'apelacion'
        ? 'chip-amber'
        : instance === 'firme'
          ? 'chip-green'
          : 'chip-blue';
  return <span className={cn('chip', tone)}>{label}</span>;
}
