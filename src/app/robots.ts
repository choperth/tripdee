import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        // Explicitly allow leading AI search crawlers (AEO / Answer Engine Optimization)
        userAgent: [
          'GPTBot',
          'ClaudeBot',
          'PerplexityBot',
          'Applebot',
          'Google-Extended',
          'Bingbot',
        ],
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
