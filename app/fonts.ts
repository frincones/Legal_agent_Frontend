/**
 * F0-T01 · LexAI UX v2 — Tipografía
 *
 * New Spirit NO está disponible en next/font/google (next 14.2.20).
 * Fallback aprobado: Newsreader (estilo editorial serif muy similar,
 * disponible en la librería de Google Fonts de Next.js).
 * Inter se mantiene como sans; ya se carga vía <link> en layout.tsx pero
 * también se exporta aquí para que los componentes v2 puedan referenciar
 * la CSS variable --font-inter de forma tipada.
 */
import { Inter, Newsreader } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const newSpirit = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-new-spirit',
  display: 'swap',
});
