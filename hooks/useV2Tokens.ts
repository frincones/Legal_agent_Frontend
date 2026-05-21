'use client';

/**
 * F0-T04 · LexAI UX v2 — Hook de activación de tokens
 *
 * Lee la env var NEXT_PUBLIC_UX_V2_TOKENS en runtime y aplica el
 * atributo [data-v2-tokens] al elemento raíz (<html>), activando todas
 * las CSS variables definidas en styles/tokens-v2.css.
 *
 * El cleanup del useEffect garantiza que el atributo se elimina si el
 * componente se desmonta (util en tests y en el showcase).
 *
 * Uso:
 *   import { useV2Tokens } from '@/hooks/useV2Tokens';
 *   // Dentro del componente (client):
 *   useV2Tokens();
 */
import { useEffect } from 'react';

export function useV2Tokens(): void {
  useEffect(() => {
    const enabled = process.env.NEXT_PUBLIC_UX_V2_TOKENS === 'true';
    if (enabled) {
      document.documentElement.setAttribute('data-v2-tokens', 'true');
    }
    return () => {
      document.documentElement.removeAttribute('data-v2-tokens');
    };
  }, []);
}
