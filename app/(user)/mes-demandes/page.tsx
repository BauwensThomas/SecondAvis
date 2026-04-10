'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Demande {
  id: string
  category: string
  title: string
  status: string
  amount_cents: number
  created_at: string
  expires_at: string
}

// Labels lisibles pour chaque statut de demande
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending:   { label: 'En attente',          className: 'bg-yellow-100 text-yellow-800' },
  answered:  { label: 'Réponse reçue',       className: 'bg-green-100 text-green-800' },
  contested: { label: 'Signalement en cours', className: 'bg-orange-100 text-orange-800' },
  refunded:  { label: 'Remboursé',           className: 'bg-slate-100 text-slate-600' },
  closed:    { label: 'Terminé',             className: 'bg-slate-100 text-slate-600' },
}

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

// Page listant toutes les demandes de l'utilisateur connecté
export default function MesDemandesPage() {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    fetch('/api/requests')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErreur(data.error)
        else setDemandes(data.requests ?? [])
        setLoading(false)
      })
      .catch(() => {
        setErreur('Impossible de charger vos demandes.')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <main className="page-container">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mes demandes</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/nouvelle-demande">Nouvelle demande</Link>
        </Button>
      </div>

      {erreur && (
        <p className="text-red-600 text-sm mb-6">{erreur}</p>
      )}

      {demandes.length === 0 && !erreur && (
        <div className="text-center py-20 text-slate-500">
          <p className="mb-4">Vous n'avez pas encore de demande.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/nouvelle-demande">Poser ma première question</Link>
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {demandes.map((demande) => {
          const statut = STATUS_LABELS[demande.status] ?? { label: demande.status, className: 'bg-slate-100 text-slate-600' }
          return (
            <Link
              key={demande.id}
              href={`/mes-demandes/${demande.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-1">
                    {CATEGORY_LABELS[demande.category] ?? demande.category}
                  </p>
                  <p className="font-semibold text-slate-800 truncate">{demande.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(demande.created_at).toLocaleDateString('fr-BE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statut.className}`}>
                  {statut.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
