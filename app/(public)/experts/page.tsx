'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Expert {
  id: string
  display_name: string
  photo_url: string | null
  bio: string | null
  categories: string[]
  years_experience: number
  city: string
  average_rating: number
  total_answers: number
}

const CATEGORIES_OPTIONS = [
  { value: '',             label: 'Toutes les catégories' },
  { value: 'mecanique',    label: 'Mécanique automobile' },
  { value: 'immo',         label: 'Immobilier' },
  { value: 'travaux',      label: 'Travaux' },
  { value: 'assurance',    label: 'Assurance' },
  { value: 'travail',      label: 'Droit du travail' },
  { value: 'comptabilite', label: 'Comptabilité' },
]

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

// Page publique - liste des experts vérifiés, filtrables par catégorie
export default function ExpertsPage() {
  const [experts, setExperts]     = useState<Expert[]>([])
  const [loading, setLoading]     = useState(true)
  const [categorie, setCategorie] = useState('')

  useEffect(() => {
    setLoading(true)
    const url = categorie ? `/api/experts?category=${categorie}` : '/api/experts'
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setExperts(data.experts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [categorie])

  return (
    <main className="page-container space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nos experts vérifiés</h1>
        <p className="text-slate-500 text-sm mt-1">Des professionnels qualifiés qui répondent à vos questions sous 24h.</p>
      </div>

      {/* Filtre par catégorie */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCategorie(opt.value)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              categorie === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Liste des experts */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && experts.length === 0 && (
        <p className="text-slate-500 text-sm">Aucun expert disponible dans cette catégorie pour le moment.</p>
      )}

      {!loading && experts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((expert) => (
            <Link key={expert.id} href={`/experts/${expert.id}`}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all space-y-3">

              {/* En-tête avec photo et nom */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {expert.photo_url
                    ? <Image src={expert.photo_url} alt={expert.display_name} width={48} height={48} className="object-cover w-full h-full" />
                    : <span className="text-xl text-slate-300">?</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{expert.display_name}</p>
                  <p className="text-xs text-slate-400">{expert.city} · {expert.years_experience} ans d'exp.</p>
                </div>
              </div>

              {/* Note */}
              <div className="flex items-center gap-1">
                <span className="text-yellow-500 text-sm">{'★'.repeat(Math.round(expert.average_rating))}{'☆'.repeat(5 - Math.round(expert.average_rating))}</span>
                <span className="text-xs text-slate-400">
                  {expert.average_rating > 0 ? expert.average_rating.toFixed(1) : 'Nouveau'} · {expert.total_answers} réponse{expert.total_answers !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Catégories */}
              <div className="flex flex-wrap gap-1">
                {expert.categories.slice(0, 3).map((cat) => (
                  <span key={cat} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </span>
                ))}
              </div>

              {/* Bio courte */}
              {expert.bio && (
                <p className="text-xs text-slate-500 line-clamp-2">{expert.bio}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
