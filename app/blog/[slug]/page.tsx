import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AdSense from '@/components/common/AdSense'

// Génère les métadonnées SEO dynamiques depuis l'article
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: post } = await supabase.from('posts').select('titre, extrait').eq('slug', slug).eq('publie', true).single()

  if (!post) return { title: 'Article introuvable' }

  return {
    title: post.titre,
    description: post.extrait ?? undefined,
  }
}

// Page publique - affiche un article de blog complet
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('publie', true)
    .single()

  if (!post) notFound()

  return (
    <main className="page-container py-12">
      <div>

        {/* Fil d'Ariane */}
        <p className="text-sm text-slate-400 mb-6">
          <Link href="/blog" className="hover:text-indigo-600 transition-colors">Blog</Link>
          <span className="mx-2">→</span>
          <span>{post.titre}</span>
        </p>

        {/* En-tête de l'article */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{post.titre}</h1>
        <p className="text-slate-400 text-sm mb-6">
          {new Date(post.created_at).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* Image de couverture + publicité côte à côte sur desktop */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">

          {/* Image de couverture */}
          {post.image_url && (
            <div className="md:w-2/3 shrink-0">
              <img src={post.image_url} alt={post.titre} className="block rounded-2xl w-full max-h-72 object-cover" />
              {post.image_ia && (
                <p className="text-xs text-slate-400 mt-1.5 italic">
                  Image générée par intelligence artificielle - Les personnages représentés sont fictifs.
                </p>
              )}
            </div>
          )}

          {/* Publicité AdSense - à droite de l'image sur desktop */}
          <div className={post.image_url ? 'md:w-1/3 w-full' : 'w-full'}>
            <AdSense slot="2564315708" />
          </div>

        </div>

        {/* Contenu de l'article - rendu HTML avec styles Tailwind prose */}
        <article
          className="prose dark:prose-invert prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contenu ?? '' }}
        />

        {/* Publicité AdSense - en bas de l'article, avant le CTA */}
        <div className="mt-10">
          <AdSense slot="2564315708" />
        </div>

        {/* Schema JSON-LD Article pour Google (résultats enrichis) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.titre,
            "description": post.extrait ?? post.titre,
            "image": post.image_url ?? undefined,
            "datePublished": post.created_at,
            "dateModified": post.created_at,
            "author": {
              "@type": "Organization",
              "name": "Avisbox",
              "url": process.env.NEXT_PUBLIC_APP_URL
            },
            "publisher": {
              "@type": "Organization",
              "name": "Avisbox",
              "url": process.env.NEXT_PUBLIC_APP_URL
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`
            }
          })}}
        />

        {/* Call-to-action en bas de chaque article */}
        <div className="mt-12 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 text-center">
          <p className="text-slate-700 dark:text-slate-200 font-semibold text-lg mb-1">Vous avez un doute sur un devis ou un diagnostic ?</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Obtenez un avis d'expert vérifié en moins de 24h à partir de 9 euros.</p>
          <Link href="/nouvelle-demande" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Poser ma question
          </Link>
        </div>

      </div>
    </main>
  )
}
