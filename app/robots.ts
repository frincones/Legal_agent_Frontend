import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lexai-frontend-rho.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/api/', '/saas/', '/inicio', '/casos', '/clientes', '/documentos',
                   '/calendario', '/notificaciones', '/buscar', '/reportes',
                   '/dashboard', '/facturacion', '/leads', '/intake-forms',
                   '/insights', '/automation', '/trust', '/firmas',
                   '/kb', '/actividad', '/menciones', '/jueces',
                   '/mi-dia', '/tareas', '/canvas', '/settings/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
