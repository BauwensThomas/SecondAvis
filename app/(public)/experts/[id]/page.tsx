'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Badge {
  id: 'top_note' | 'rapide' | 'fiable'
  label: string
  couleur: 'yellow' | 'green' | 'blue'
}

interface Expert {
  id: string
  display_name: string
  photo_url: string | null
  bio: string | null
  categories: string[]
  years_experience: number
  city: string
  languages: string[]
  availabilities: string | null
  website_url: string | null
  entity_type: string
  company_name: string | null
  average_rating: number
  total_answers: number
  created_at: string
  phone: string | null
  phone_public: boolean
  address_street: string | null
  address_zip: string | null
  address_city: string | null
  address_public: boolean
  badges?: Badge[]
}

interface Avis {
  score: number
  comment: string | null
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

const LANGUE_LABELS: Record<string, string> = {
  fr: 'Français',
  nl: 'Néerlandais',
  en: 'Anglais',
}

// Page publique du profil d'un expert avec ses avis
export default function ExpertPublicPage() {
  const { id } = useParams<{ id: string }>()
  const [expert, setExpert] = useState<Expert | null>(null)
  const [avis, setAvis]     = useState<Avis[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur]   = useState('')

  useEffect(() => {
    fetch(`/api/experts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErreur(data.error)
        else { setExpert(data.expert); setAvis(data.avis ?? []); setBadges(data.badges ?? []) }
        setLoading(false)
      })
      .catch(() => { setErreur('Impossible de charger ce profil.'); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <main className="page-container space-y-4">
        <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
      </main>
    )
  }

  if (erreur || !expert) {
    return (
      <main className="page-container">
        <p className="text-red-600 text-sm">{erreur || 'Expert introuvable.'}</p>
        <Link href="/experts" className="text-blue-600 text-sm hover:underline mt-2 block">← Retour à la liste</Link>
      </main>
    )
  }

  return (
    <main className="page-container space-y-6">
      <Link
        href="/experts"
        className="inline-block text-sm font-medium bg-white text-slate-600 border border-slate-200 rounded-lg px-4 py-2 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
        style={{ textDecoration: 'none' }}
      >
        ← Retour à la liste
      </Link>

      {/* ---- Carte principale ---- */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
            {expert.photo_url
              ? <Image src={expert.photo_url} alt={expert.display_name} width={80} height={80} loading="eager" className="object-cover w-full h-full" />
              : <span className="text-3xl text-slate-300">?</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{expert.display_name}</h1>
            {expert.company_name && (
              <p className="text-sm text-slate-500">{expert.company_name}</p>
            )}
            <p className="text-sm text-slate-500 mt-0.5">{expert.city} · {expert.years_experience} ans d'expérience</p>

            {/* Note globale */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-yellow-500">{'★'.repeat(Math.round(expert.average_rating))}{'☆'.repeat(5 - Math.round(expert.average_rating))}</span>
              <span className="text-sm text-slate-500">
                {expert.average_rating > 0 ? expert.average_rating.toFixed(1) : 'Nouveau'}
                {' '}· {expert.total_answers} réponse{expert.total_answers !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Badges automatiques */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {badges.map((badge) => (
                  <span key={badge.id} className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                    badge.couleur === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    badge.couleur === 'green'  ? 'bg-green-50 text-green-700 border-green-200' :
                                                 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {expert.bio && (
          <p className="text-sm text-slate-700 leading-relaxed">{expert.bio}</p>
        )}

        {/* Catégories */}
        <div className="flex flex-wrap gap-2">
          {expert.categories.map((cat) => (
            <span
              key={cat}
              className="text-xs px-3 py-1 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700"
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
          ))}
        </div>

        {/* Infos complémentaires */}
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
          {expert.languages.length > 0 && (
            <div>
              <span className="font-medium text-slate-700">Langues : </span>
              {expert.languages.map((l) => LANGUE_LABELS[l] ?? l).join(', ')}
            </div>
          )}
          {expert.availabilities && (
            <div>
              <span className="font-medium text-slate-700">Disponibilités : </span>
              {expert.availabilities}
            </div>
          )}
          {expert.phone_public && expert.phone && (
            <div>
              <span className="font-medium text-slate-700">Téléphone : </span>
              <a href={`tel:${expert.phone}`} className="text-indigo-600 dark:text-green-400 hover:text-indigo-800 dark:hover:text-green-200 transition-colors">{expert.phone}</a>
            </div>
          )}
          {expert.address_public && expert.address_street && (
            <div>
              <span className="font-medium text-slate-700">Adresse : </span>
              {expert.address_street}, {expert.address_zip} {expert.address_city}
            </div>
          )}
        </div>

        {/* Site web - visible uniquement si l'expert a répondu au moins une fois */}
        {expert.website_url && expert.total_answers > 0 && (
          <a
            href={expert.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 dark:text-green-400 hover:text-indigo-800 dark:hover:text-green-200 transition-colors inline-block"
          >
            {expert.website_url.replace(/^https?:\/\//, '')}
          </a>
        )}
      </section>

      {/* ---- Avis reçus ---- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Avis clients {avis.length > 0 && <span className="text-slate-400 font-normal text-sm">({avis.length} dernier{avis.length !== 1 ? 's' : ''})</span>}
        </h2>

        {avis.length === 0 && (
          <p className="text-slate-500 text-sm">Aucun avis pour le moment.</p>
        )}

        {avis.map((a, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 text-sm">{'★'.repeat(a.score)}{'☆'.repeat(5 - a.score)}</span>
              <span className="text-xs text-slate-400">
                {new Date(a.created_at).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {a.comment && <p className="text-sm text-slate-600">{a.comment}</p>}
          </div>
        ))}
      </section>

      {/* ---- CTA ---- */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center space-y-3">
        <p className="text-sm text-slate-700 font-medium">Vous avez une question pour un expert ?</p>
        <Link href="/nouvelle-demande"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors">
          Poser ma question
        </Link>
      </div>
    </main>
  )
}
