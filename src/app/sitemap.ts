import type { MetadataRoute } from 'next';
import { POPULAR_ROUTES } from '@/data/mockData';
import { fetchVehicles } from '@/lib/supabase/service';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tripdee.co';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Core Landing Pages & Section Views
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          th: `${BASE_URL}/?lang=th`,
          en: `${BASE_URL}/?lang=en`,
          'zh-CN': `${BASE_URL}/?lang=zh`,
        },
      },
    },
    {
      url: `${BASE_URL}/?tab=van`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/?tab=hotel`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/?tab=car`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/?tab=corporate`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Destination Route Views
  const routeEntries: MetadataRoute.Sitemap = POPULAR_ROUTES.map((route) => ({
    url: `${BASE_URL}/?route=${encodeURIComponent(route.filterKey)}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Shareable vehicle detail pages (/vehicle/[id])
  let vehicleEntries: MetadataRoute.Sitemap = [];
  try {
    const vehicles = await fetchVehicles();
    vehicleEntries = vehicles
      .filter((v) => v.approvalStatus !== 'pending' && v.approvalStatus !== 'rejected')
      .map((v) => ({
        url: `${BASE_URL}/vehicle/${encodeURIComponent(v.id)}`,
        lastModified: currentDate,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
  } catch {
    vehicleEntries = [];
  }

  return [...staticRoutes, ...routeEntries, ...vehicleEntries];
}
