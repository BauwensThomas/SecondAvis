'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import TiptapEditor from '@/components/common/TiptapEditor'
import type { Post } from '@/types'

interface BlogFormProps {
  postInitial?: Post
}

// Génère un slug URL-friendly depuis un titre
function genererSlug(titre: string): string {
  return titre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Formulaire de création et d'édition d'un article de blog
export default function BlogForm({ postInitial }: BlogFormProps) {
  const router = useRouter()
  const estEdition = !!postInitial

  const [titre, setTitre]       = useState(postInitial?.titre ?? '')
  const [slug, setSlug]         = useState(postInitial?.slug ?? '')
  const [extrait, setExtrait]   = useState(postInitial?.extrait ?? '')
  const [contenu, setContenu]   = useState(postInitial?.contenu ?? '')
  const [imageUrl, setImageUrl] = useState(postInitial?.image_url ?? '')
  const [imageIa, setImageIa]   = useState(postInitial?.image_ia ?? false)
  const [erreur, setErreur]     = useState('')
  const [envoi, setEnvoi]       = useState(false)

  // Met à jour le slug automatiquement quand le titre change (sauf si déjà édité manuellement)
  function handleTitreChange(val: string) {
    setTitre(val)
    if (!estEdition) setSlug(genererSlug(val))
  }

  // Upload de l'image de couverture vers Supabase Storage
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (res.ok) setImageUrl(data.url)
    else setErreur(data.error ?? "Erreur lors de l'upload de l'image.")
  }

  async function sauvegarder(publie: boolean) {
    if (!titre.trim()) { setErreur('Le titre est obligatoire.'); return }
    if (!slug.trim())  { setErreur('Le slug est obligatoire.'); return }

    setEnvoi(true)
    setErreur('')

    const payload = { titre, slug, extrait: extrait || null, contenu, image_url: imageUrl || null, image_ia: imageIa, publie }

    const res = await fetch(
      estEdition ? `/api/admin/blog/${postInitial!.id}` : '/api/admin/blog',
      { method: estEdition ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )
    const data = await res.json()

    if (!res.ok) { setErreur(data.error ?? 'Une erreur est survenue.'); setEnvoi(false); return }

    router.push('/admin/blog')
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {estEdition ? 'Modifier l\'article' : 'Nouvel article'}
        </h1>
        <Button variant="ghost" onClick={() => router.push('/admin/blog')}>Annuler</Button>
      </div>

      {erreur && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">{erreur}</p>}

      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titre</label>
        <input type="text" value={titre} onChange={(e) => handleTitreChange(e.target.value)} placeholder="Titre de l'article" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug (URL)</label>
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-de-l-article" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono" />
        <p className="text-xs text-slate-400 mt-1">Sera accessible sur : /blog/{slug || '...'}</p>
      </div>

      {/* Extrait */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Extrait <span className="text-slate-400 font-normal">(max 160 caractères, affiché sur la liste)</span></label>
        <textarea value={extrait} onChange={(e) => setExtrait(e.target.value)} maxLength={160} rows={2} placeholder="Courte description de l'article..." className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none" />
        <p className="text-xs text-slate-400 mt-1">{extrait.length}/160</p>
      </div>

      {/* Image de couverture */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image de couverture</label>
        {imageUrl && (
          <div className="relative mb-2">
            <img src={imageUrl} alt="Apercu couverture" className="w-full max-h-64 object-contain rounded-lg bg-slate-100 dark:bg-slate-800" />
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/admin/blog/delete-image', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: imageUrl }),
                })
                setImageUrl('')
              }}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-2 py-1 rounded transition-colors"
            >
              Supprimer
            </button>
          </div>
        )}
        <label className="inline-flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <span>{imageUrl ? 'Changer l\'image' : 'Choisir une image'}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageUpload} className="hidden" />
        </label>
        <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP ou GIF - max 5MB</p>
        {/* Case à cocher image générée par IA */}
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={imageIa}
            onChange={(e) => setImageIa(e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-sm text-slate-600 dark:text-slate-300">Image générée par IA</span>
        </label>
      </div>

      {/* Contenu */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contenu</label>
        <TiptapEditor value={contenu} onChange={setContenu} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={() => sauvegarder(true)} disabled={envoi} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {envoi ? 'Enregistrement...' : 'Publier'}
        </Button>
        <Button onClick={() => sauvegarder(false)} disabled={envoi} variant="outline">
          Sauvegarder en brouillon
        </Button>
      </div>
    </div>
  )
}
