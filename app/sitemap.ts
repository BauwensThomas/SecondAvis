import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Génère le sitemap XML automatiquement - pages statiques + profils experts actifs
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages publiques statiques
  const staticPages: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${appUrl}/experts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${appUrl}/comment-ca-marche`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${appUrl}/devenir-expert`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${appUrl}/comment-poser-ma-question`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${appUrl}/a-propos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${appUrl}/cgu`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${appUrl}/politique-confidentialite`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${appUrl}/mentions-legales`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Profils publics des experts vérifiés et actifs
  try {
    const supabase = createAdminClient()
    const { data: experts } = await supabase
      .from('experts')
      .select('id, created_at')
      .eq('is_verified', true)
      .eq('is_active', true)

    const expertPages: MetadataRoute.Sitemap = (experts ?? []).map((expert) => ({
      url: `${appUrl}/experts/${expert.id}`,
      lastModified: new Date(expert.created_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return [...staticPages, ...expertPages]
  } catch {
    return staticPages
  }
}
