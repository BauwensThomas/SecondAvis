import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Génère le sitemap XML automatiquement - pages statiques + profils experts actifs
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages publiques statiques
  const staticPages: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${appUrl}/experts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    // Pages de landing par catégorie - priorité haute pour le SEO ciblé
    { url: `${appUrl}/mecanique`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${appUrl}/immo`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${appUrl}/travaux`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${appUrl}/assurance`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${appUrl}/travail`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${appUrl}/comptabilite`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${appUrl}/comment-ca-marche`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${appUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${appUrl}/devenir-expert`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${appUrl}/comment-poser-ma-question`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${appUrl}/a-propos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${appUrl}/cgu`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${appUrl}/politique-confidentialite`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${appUrl}/mentions-legales`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Profils publics des experts vérifiés et actifs + articles de blog publiés
  try {
    const supabase = createAdminClient()

    const [{ data: experts }, { data: posts }] = await Promise.all([
      supabase.from('experts').select('id, created_at').eq('is_verified', true).eq('is_active', true),
      supabase.from('posts').select('slug, created_at').eq('publie', true).order('created_at', { ascending: false }),
    ])

    const expertPages: MetadataRoute.Sitemap = (experts ?? []).map((expert) => ({
      url: `${appUrl}/experts/${expert.id}`,
      lastModified: new Date(expert.created_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    const blogPages: MetadataRoute.Sitemap = [
      { url: `${appUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
      ...(posts ?? []).map((post) => ({
        url: `${appUrl}/blog/${post.slug}`,
        lastModified: new Date(post.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ]

    return [...staticPages, ...blogPages, ...expertPages]
  } catch {
    return staticPages
  }
}
