import { MetadataRoute } from 'next'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Règles robots.txt - autorise Google sur les pages publiques, bloque l'admin et les API
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/mes-demandes', '/mon-compte', '/expert/'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
