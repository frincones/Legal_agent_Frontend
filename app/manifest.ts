import type { MetadataRoute } from 'next';

/**
 * Sprint 12 · PWA manifest.
 * Next.js renderiza este archivo como /manifest.webmanifest automáticamente.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LexAI · Asistente legal voice-first',
    short_name: 'LexAI',
    description:
      'Asistente legal voice-first para abogados hispanos. Casos, plazos, documentos, voz.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0b0d10',
    theme_color: '#0b0d10',
    lang: 'es-CO',
    categories: ['business', 'productivity', 'legal'],
    icons: [
      // Next.js auto-genera icon.svg como favicon; reusamos para todos los tamaños
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Casos',
        short_name: 'Casos',
        description: 'Mis casos activos',
        url: '/casos',
      },
      {
        name: 'Inbox',
        short_name: 'Inbox',
        description: 'Notificaciones unificadas',
        url: '/notificaciones',
      },
      {
        name: 'Canvas',
        short_name: 'Canvas',
        description: 'Editor legal con IA',
        url: '/canvas',
      },
    ],
    prefer_related_applications: false,
  };
}
