'use client';

/**
 * F5-T06 · LexAI UX v2 — AgentEditingChip
 *
 * Chip flotante que aparece en el thread cuando el agente está editando el canvas.
 * Estado "editing": muestra "LexAI está editando: [descripción]" con loader animado.
 * Estado "done": chip transiciona a "Editado" con check verde, desaparece a los 3s.
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export interface AgentEditingChipProps {
  /** Cuando true: muestra el chip activo (editing). Cuando cambia a false: transiciona a done y desaparece. */
  isEditing: boolean;
  /** Descripción de qué está editando el agente (opcional). */
  description?: string;
}

export function AgentEditingChip({ isEditing, description }: AgentEditingChipProps) {
  const [phase, setPhase] = useState<'hidden' | 'editing' | 'done'>('hidden');

  useEffect(() => {
    if (isEditing) {
      setPhase('editing');
    } else if (phase === 'editing') {
      setPhase('done');
      const t = setTimeout(() => setPhase('hidden'), 3_000);
      return () => clearTimeout(t);
    }
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  if (phase === 'hidden') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        transition: 'all 300ms ease',
        backgroundColor:
          phase === 'editing'
            ? 'color-mix(in srgb, var(--v2-accent-copper, #B8763C) 12%, white)'
            : 'color-mix(in srgb, #16a34a 10%, white)',
        color:
          phase === 'editing'
            ? 'var(--v2-accent-copper, #B8763C)'
            : '#15803d',
        border:
          phase === 'editing'
            ? '1px solid color-mix(in srgb, var(--v2-accent-copper, #B8763C) 30%, transparent)'
            : '1px solid #bbf7d0',
      }}
    >
      {phase === 'editing' ? (
        <>
          <Loader2
            size={12}
            style={{ animation: 'spin 1s linear infinite' }}
            aria-hidden
          />
          <span>
            LexAI está editando{description ? `: ${description}` : ''}
          </span>
        </>
      ) : (
        <>
          <CheckCircle2 size={12} aria-hidden />
          <span>Editado</span>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
