'use client'

import { useEffect, useState } from 'react'
import ExpertGuard, { useExpertContext } from '@/components/layout/ExpertGuard'

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

interface Answer {
  id: string
  content: string
  verdict: string | null
  delivered_at: string
  payment_eligible_at: string
  is_paid: boolean
  is_contested: boolean
  contest_decision: string | null
  contest_resolved: boolean
  requests: { id: string; title: string; category: string } | null
  ratings: { score: number; comment: string | null }[] | null
}

// Retourne le badge de statut de paiement d'une réponse
function StatutPaiement({ answer }: { answer: Answer }) {
  if (answer.is_paid) {
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">Payé</span>
  }
  if (answer.is_contested && answer.contest_resolved && answer.contest_decision === 'refund') {
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">Signalement - réponse refusée</span>
  }
  if (answer.is_contested && answer.contest_resolved && answer.contest_decision === 'validate') {
    const dateVirement = new Date(answer.payment_eligible_at).toLocaleDateString('fr-BE', {
      day: 'numeric', month: 'long',
    })
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Signalement levé - virement prévu le {dateVirement}</span>
  }
  if (answer.is_contested && !answer.contest_resolved) {
    // Signalement en cours, pas encore de décision admin
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">Contesté - en attente de décision</span>
  }
  // Le client a noté → il a accepté la réponse, le paiement arrivera dans les 5 jours
  if (answer.ratings && answer.ratings.length > 0) {
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Validé</span>
  }
  return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">En attente</span>
}

// Page listant toutes les réponses de l'expert avec leurs notes et statuts de paiement
function MesReponsesPage() {
  const { role, hasExpertAccount } = useExpertContext()
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [deplie, setDeplie] = useState<Set<string>>(new Set())

  // Ouvre ou ferme le contenu complet d'une réponse
  function toggleDeplie(id: string) {
    setDeplie((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (role === 'admin' && !hasExpertAccount) { setLoading(false); return }
    fetch('/api/expert/answers')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErreur(data.error)
        else setAnswers(data.answers ?? [])
        setLoading(false)
      })
      .catch(() => {
        setErreur('Impossible de charger vos réponses.')
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, hasExpertAccount])

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
      <main className="page-container space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
      </main>
    )
  }

  return (
    <main className="page-container">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Mes réponses</h1>

      {erreur && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-6">{erreur}</p>
      )}

      {answers.length === 0 && !erreur && (
        <p className="text-slate-500 text-center py-20">Vous n'avez pas encore répondu à une demande.</p>
      )}

      <div className="space-y-4">
        {answers.map((answer) => {
          const note = answer.ratings?.[0]
          return (
            <div key={answer.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-1">
                    {answer.requests ? CATEGORY_LABELS[answer.requests.category] : ''}
                  </p>
                  <p className="font-semibold text-slate-800 truncate">
                    {answer.requests?.title ?? 'Demande supprimée'}
                  </p>
                  {answer.verdict && (
                    <p className="text-sm text-slate-500 mt-1 italic">"{answer.verdict}"</p>
                  )}
                </div>
                <StatutPaiement answer={answer} />
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  {new Date(answer.delivered_at).toLocaleDateString('fr-BE', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                {note ? (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`text-sm ${i <= note.score ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                    ))}
                    <span className="text-xs text-slate-400 ml-1">{note.score}/5</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Pas encore noté</span>
                )}
              </div>

              {/* Bouton pour afficher ou masquer la réponse complète */}
              <button
                type="button"
                onClick={() => toggleDeplie(answer.id)}
                className="mt-3 text-xs text-slate-400 hover:text-slate-700 underline"
              >
                {deplie.has(answer.id) ? 'Masquer ma réponse' : 'Voir ma réponse'}
              </button>

              {deplie.has(answer.id) && (
                <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {answer.content}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}

export default function MesReponsesPageGuarded() {
  return <ExpertGuard><MesReponsesPage /></ExpertGuard>
}
