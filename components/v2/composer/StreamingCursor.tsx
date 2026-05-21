'use client';

/**
 * F3-T07 · LexAI UX v2 — StreamingCursor
 *
 * Cursor parpadeante estilo Claude (▍) con timing de 530ms.
 * Se renderiza al final del texto mientras el streaming está activo.
 * Se retira automáticamente cuando `streaming` pasa a false.
 */

import { useEffect, useState } from 'react';

interface StreamingCursorProps {
  /** Si el streaming está en progreso; cuando pasa a false, el cursor desaparece. */
  streaming: boolean;
  /** Carácter del cursor. Por defecto ▍ (igual que Claude). */
  char?: string;
}

export function StreamingCursor({ streaming, char = '▍' }: StreamingCursorProps) {
  const [visible, setVisible] = useState(true);

  // Parpadea cada 530ms mientras streaming esté activo
  useEffect(() => {
    if (!streaming) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const interval = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, [streaming]);

  if (!streaming) return null;

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        marginLeft: '1px',
        verticalAlign: 'text-bottom',
        opacity: visible ? 1 : 0,
        transition: 'opacity 60ms linear',
        userSelect: 'none',
        color: 'var(--v2-accent-copper, #B8763C)',
        lineHeight: 1,
      }}
    >
      {char}
    </span>
  );
}
