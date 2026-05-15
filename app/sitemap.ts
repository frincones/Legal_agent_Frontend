import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lexai-frontend-rho.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/customers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/changelog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/seguridad`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/status`, lastModified: now, changeFrequency: 'daily', priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/dpa`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/aviso-privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/tramites`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];

  // Dynamic: changelog entries
  try {
    const r = await fetch(`${BASE_URL}/api/public/changelog?limit=100`, { cache: 'no-store' });
    if (r.ok) {
      const data = await r.json();
      const dynamicRoutes: MetadataRoute.Sitemap = (data.items || []).map((c: any) => ({
        url: `${BASE_URL}/changelog/${c.slug}`,
        lastModified: new Date(c.released_at),
        changeFrequency: 'monthly' as const,
        priority: 0.4,
      }));
      return [...staticRoutes, ...dynamicRoutes];
    }
  } catch {}

  return staticRoutes;
}
