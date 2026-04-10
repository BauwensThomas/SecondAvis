'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ExpertGuard, { useExpertContext } from '@/components/layout/ExpertGuard'

interface Demande {
  id: string
  category: string
  title: string
  description: string
  created_at: string
  expires_at: string
  amount_cents: number
}

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

// Calcule le temps restant avant expiration d'une demande
function tempsRestant(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expirée'
  const heures = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (heures >= 24) return `${Math.floor(heures / 24)}j ${heures % 24}h`
  return `${heures}h ${minutes}min`
}

// Dashboard expert - liste les demandes disponibles dans ses catégories
function ExpertDashboardPage() {
  const { role, hasExpertAccount } = useExpertContext()
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (role === 'admin' && !hasExpertAccount) { setLoading(false); return }

    fetch('/api/expert/requests')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErreur(data.error)
        else setDemandes(data.requests ?? [])
        setLoading(false)
      })
      .catch(() => {
        setErreur('Impossible de charger les demandes.')
        setLoading(false)
      })
  }, [])

  // Admin sans compte expert : message informatif
  if (role === 'admin' && !hasExpertAccount) {
    return (
      <main className="page-container">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-blue-900 mb-1">Espace expert</p>
          <p className="text-blue-700 text-sm">Votre compte administrateur n'a pas de profil expert associé.</p>
          <p className="text-blue-600 text-sm mt-1">Gérez les experts depuis <a href="/admin/experts" className="underline font-medium">l'espace admin</a>.</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="page-container">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 text-sm mt-1">
          {demandes.length === 0
            ? 'Aucune demande disponible pour le moment.'
            : `${demandes.length} demande${demandes.length > 1 ? 's' : ''} en attente de réponse`}
        </p>
      </div>

      {erreur && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          {erreur}
        </p>
      )}

      <div className="space-y-4">
        {demandes.map((demande) => {
          const restant = tempsRestant(demande.expires_at)
          const urgent = new Date(demande.expires_at).getTime() - Date.now() < 6 * 60 * 60 * 1000

          return (
            <Link
              key={demande.id}
              href={`/expert/demandes/${demande.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-1">
                    {CATEGORY_LABELS[demande.category] ?? demande.category}
                  </p>
                  <p className="font-semibold text-slate-800 truncate">{demande.title}</p>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                  urgent ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {restant}
                </span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">{demande.description}</p>
              <p className="text-xs text-blue-600 mt-3 font-medium">Voir et répondre →</p>
            </Link>
          )
        })}
      </div>
    </main>
  )
}

// Exporte la page enveloppée dans le guard expert
export default function ExpertDashboardPageGuarded() {
  return (
    <ExpertGuard>
      <ExpertDashboardPage />
    </ExpertGuard>
  )
}
