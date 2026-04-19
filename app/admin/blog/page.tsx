'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Post } from '@/types'

const CATEGORIES: Record<string, { label: string; couleur: string }> = {
  mecanique:    { label: 'Mécanique',  couleur: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  immo:         { label: 'Immobilier', couleur: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  travaux:      { label: 'Travaux',    couleur: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  assurance:    { label: 'Assurance',  couleur: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  travail:      { label: 'Droit trav.', couleur: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  comptabilite: { label: 'Comptabilité', couleur: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
}

// Page admin - liste de tous les articles du blog avec filtre par catégorie et recherche
export default function AdminBlogPage() {
  const [posts, setPosts]           = useState<Post[]>([])
  const [chargement, setChargement] = useState(true)
  const [envoi, setEnvoi]           = useState<string | null>(null)
  const [resultat, setResultat]     = useState<{ id: string; envoyes: number; erreurs: number } | null>(null)
  const [recherche, setRecherche]   = useState('')
  const [filtreCategorie, setFiltreCategorie] = useState('')
  const [filtreStatut, setFiltreStatut]       = useState('')

  useEffect(() => {
    fetch('/api/admin/blog')
      .then((r) => r.json())
      .then((data) => { setPosts(data.posts ?? []); setChargement(false) })
      .catch(() => setChargement(false))
  }, [])

  // Filtre combiné : recherche texte + catégorie + statut
  const postsFiltres = useMemo(() => {
    return posts.filter((p) => {
      const texte = recherche.toLowerCase()
      const matchRecherche = !texte || p.titre.toLowerCase().includes(texte) || (p.extrait ?? '').toLowerCase().includes(texte)
      const matchCategorie = !filtreCategorie || p.categorie === filtreCategorie
      const matchStatut    = !filtreStatut || (filtreStatut === 'publie' ? p.publie : !p.publie)
      return matchRecherche && matchCategorie && matchStatut
    })
  }, [posts, recherche, filtreCategorie, filtreStatut])

  async function supprimerArticle(id: string) {
    if (!confirm('Supprimer cet article définitivement ?')) return
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  // Envoie la newsletter de l'article à tous les abonnés
  async function envoyerNewsletter(post: Post) {
    if (!confirm(`Envoyer la newsletter "${post.titre}" à tous les abonnés ?`)) return
    setEnvoi(post.id)
    setResultat(null)
    try {
      const res = await fetch(`/api/admin/blog/${post.id}/newsletter`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) setResultat({ id: post.id, envoyes: data.envoyes, erreurs: data.erreurs })
      else alert(data.error ?? 'Erreur lors de l\'envoi.')
    } finally {
      setEnvoi(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blog</h1>
          <p className="text-slate-500 text-sm mt-1">{postsFiltres.length} / {posts.length} article{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link href="/admin/blog/nouveau">Nouvel article</Link>
        </Button>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Rechercher un article..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 min-w-48 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
        <select value={filtreCategorie} onChange={(e) => setFiltreCategorie(e.target.value)} className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
          <option value="">Toutes les catégories</option>
          {Object.entries(CATEGORIES).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
          <option value="">Tous les statuts</option>
          <option value="publie">Publiés</option>
          <option value="brouillon">Brouillons</option>
        </select>
      </div>

      {/* Confirmation d'envoi newsletter */}
      {resultat && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <p className="text-green-700 text-sm font-medium">
            Newsletter envoyée : {resultat.envoyes} email{resultat.envoyes > 1 ? 's' : ''} envoyé{resultat.envoyes > 1 ? 's' : ''}
            {resultat.erreurs > 0 && `, ${resultat.erreurs} erreur${resultat.erreurs > 1 ? 's' : ''}`}.
          </p>
          <button onClick={() => setResultat(null)} className="text-green-500 hover:text-green-700 text-xs ml-4">Fermer</button>
        </div>
      )}

      {chargement ? (
        <div className="text-slate-500">Chargement...</div>
      ) : postsFiltres.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">{posts.length === 0 ? 'Aucun article pour l\'instant.' : 'Aucun résultat pour ces filtres.'}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Titre</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Catégorie</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Date</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {postsFiltres.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{post.titre}</p>
                    {post.extrait && <p className="text-slate-400 text-xs mt-0.5 truncate max-w-xs">{post.extrait}</p>}
                  </td>
                  <td className="px-4 py-3">
                    {post.categorie ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIES[post.categorie]?.couleur}`}>
                        {CATEGORIES[post.categorie]?.label}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      post.publie
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {post.publie ? 'Publié' : 'Brouillon'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(post.created_at).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {post.publie && (
                        <>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/blog/${post.slug}`} target="_blank">Voir</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            onClick={() => envoyerNewsletter(post)}
                            disabled={envoi === post.id}
                          >
                            {envoi === post.id ? 'Envoi...' : 'Newsletter'}
                          </Button>
                        </>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/blog/${post.id}/modifier`}>Modifier</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => supprimerArticle(post.id)}>
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
