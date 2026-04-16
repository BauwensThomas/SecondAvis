import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import AdSense from '@/components/common/AdSense'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Conseils et guides pratiques pour éviter les arnaques et mieux comprendre vos droits.',
}

// Page publique - liste de tous les articles publiés du blog
export default async function BlogPage() {
  const supabase = createAdminClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, titre, slug, image_url, extrait, created_at')
    .eq('publie', true)
    .order('created_at', { ascending: false })

  return (
    <main className="page-container py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Blog</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Conseils pratiques et guides pour mieux comprendre vos droits.</p>

      {/* Publicité AdSense - sous le titre de la liste */}
      <div className="mb-8">
        <AdSense slot="1299322183" />
      </div>

      {!posts || posts.length === 0 ? (
        <p className="text-slate-400 text-center py-20">Aucun article publié pour l'instant. Revenez bientôt.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
              {post.image_url && (
                <img src={post.image_url} alt={post.titre} className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" />
              )}
              <div className="p-5">
                <p className="text-xs text-slate-400 mb-2">
                  {new Date(post.created_at).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h2 className="font-semibold text-slate-900 dark:text-white text-lg leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{post.titre}</h2>
                {post.extrait && <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 line-clamp-2">{post.extrait}</p>}
                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-3">Lire l'article →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
