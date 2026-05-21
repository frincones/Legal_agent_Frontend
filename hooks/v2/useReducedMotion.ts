'use client';

/**
 * F6-T05 · LexAI UX v2 — useReducedMotion
 *
 * Detecta la preferencia de sistema `prefers-reduced-motion: reduce`.
 * Usar en framer-motion para condicionar animaciones:
 *
 *   const reduced = useReducedMotion();
 *   <motion.div animate={reduced ? {} : { opacity: 1, y: 0 }} />
 *
 * El CSS también tiene la regla @media (prefers-reduced-motion: reduce)
 * en tokens-v2.css como fallback.
 */
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
