'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ExpertGuard, { useExpertContext } from '@/components/layout/ExpertGuard'

interface Balance {
  total_earned: number
  total_pending: number
  total_contested: number
  expert_payment_cents: number
  answers: {
    id: string
    is_paid: boolean
    is_contested: boolean
    contest_decision: string | null
    delivered_at: string
    payment_eligible_at: string
    contest_window_ends: string
    requests: { title: string; category: string } | null
  }[]
}

// Décale une date au lundi suivant si elle tombe un samedi ou un dimanche
function dateVirementEffectif(date: Date): Date {
  const jour = date.getDay()
  if (jour === 6) { date.setDate(date.getDate() + 2) }
  else if (jour === 0) { date.setDate(date.getDate() + 1) }
  return date
}

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

// Formate un montant en centimes vers euros
function euros(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

// Page des gains de l'expert - affiche les totaux, le compte bancaire et l'historique
function GainsPage() {
  const { role, hasExpertAccount } = useExpertContext()
  const [balance, setBalance] = useState<Balance | null>(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [stripeConnected, setStripeConnected] = useState<boolean | null>(null)
  const [stripeLoading, setStripeLoading]     = useState(false)
  const searchParams = useSearchParams()

  // Vérifie le statut du compte Stripe Connect
  useEffect(() => {
    if (role === 'admin' && !hasExpertAccount) return
    fetch('/api/expert/stripe/connect')
      .then((r) => r.json())
      .then((data) => setStripeConnected(data.connected ?? false))
      .catch(() => setStripeConnected(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, hasExpertAccount])

  // Redirige vers Stripe si le lien a expiré
  useEffect(() => {
    if (searchParams.get('stripe') === 'refresh') connectStripe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Lance le flux d'onboarding Stripe Connect
  async function connectStripe() {
    setStripeLoading(true)
    const res  = await fetch('/api/expert/stripe/connect', { method: 'POST' })
    const json = await res.json()
    if (json.url) window.location.href = json.url
    else setStripeLoading(false)
  }

  useEffect(() => {
    if (role === 'admin' && !hasExpertAccount) { setLoading(false); return }
    fetch('/api/expert/balance')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErreur(data.error)
        else setBalance(data)
        setLoading(false)
      })
      .catch(() => {
        setErreur('Impossible de charger vos gains.')
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
        <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
      </main>
    )
  }

  if (erreur || !balance) {
    return (
      <main className="page-container">
        <p className="text-red-600 text-sm">{erreur}</p>
      </main>
    )
  }

  const now = new Date()

  return (
    <main className="page-container space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Mes gains</h1>

      {/* Résumé des montants */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400 mb-2">Total gagné</p>
          <p className="text-3xl font-bold text-green-600">{euros(balance.total_earned)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400 mb-2">En attente de paiement</p>
          <p className="text-3xl font-bold text-yellow-600">{euros(balance.total_pending)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-sm text-slate-400 mb-2">Gelé (signalement)</p>
          <p className="text-3xl font-bold text-orange-600">{euros(balance.total_contested)}</p>
        </div>
      </div>

      <p className="text-sm text-slate-400">
        Chaque réponse validée vous rapporte {euros(balance.expert_payment_cents)}, versé automatiquement
        5 jours après la livraison si aucun signalement n'est déposé.
      </p>

      {/* Compte bancaire Stripe */}
      {(() => {
        const stripeSuccess = searchParams.get('stripe') === 'success'
        const estConnecte   = stripeConnected === true || stripeSuccess
        return (
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-800">Compte bancaire</p>
              {estConnecte
                ? <p className="text-sm text-green-600 mt-0.5">En ordre - les paiements sont automatiques</p>
                : <p className="text-sm text-red-500 mt-0.5">Non connecté - vous ne pouvez pas recevoir de paiements</p>
              }
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {estConnecte && <span className="text-green-500 text-xl">✓</span>}
              {estConnecte
                ? (
                  <Button type="button" size="sm" variant="outline" onClick={connectStripe} disabled={stripeLoading}>
                    {stripeLoading ? 'Redirection...' : 'Modifier'}
                  </Button>
                )
                : (
                  <Button type="button" size="sm" onClick={connectStripe} disabled={stripeLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {stripeLoading ? 'Redirection...' : 'Connecter'}
                  </Button>
                )
              }
            </div>
          </div>
        )
      })()}

      {/* Historique des réponses */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Historique</h2>

        {balance.answers.length === 0 && (
          <p className="text-slate-500 text-sm">Aucune réponse pour le moment.</p>
        )}

        <div className="space-y-3">
          {balance.answers.map((answer) => {
            let statut = ''
            let couleur = ''

            if (answer.is_paid) {
              statut = `Payé - ${euros(balance.expert_payment_cents)}`
              couleur = 'text-green-600'
            } else if (answer.is_contested && answer.contest_decision === 'refund') {
              statut = 'Refusé - 0,00 €'
              couleur = 'text-red-600'
            } else if (answer.is_contested && answer.contest_decision === 'validate') {
              // Signalement levé, paiement planifié - décale au lundi si weekend
              const dateEffective = dateVirementEffectif(new Date(answer.payment_eligible_at))
              const dateVirement = dateEffective.toLocaleDateString('fr-BE', {
                day: 'numeric', month: 'long',
              })
              statut = dateEffective > now
                ? `Validé - virement prévu le ${dateVirement} (${euros(balance.expert_payment_cents)})`
                : `Validé - virement en cours (${euros(balance.expert_payment_cents)})`
              couleur = 'text-blue-600'
            } else if (answer.is_contested) {
              statut = 'Contesté - en attente de décision'
              couleur = 'text-orange-600'
            } else if (new Date(answer.payment_eligible_at) < now) {
              statut = `Virement en cours - ${euros(balance.expert_payment_cents)}`
              couleur = 'text-yellow-600'
            } else {
              // Paiement planifié - décale au lundi si weekend
              const dateEffective = dateVirementEffectif(new Date(answer.payment_eligible_at))
              const dateVirement = dateEffective.toLocaleDateString('fr-BE', {
                day: 'numeric', month: 'long',
              })
              statut = `Virement prévu le ${dateVirement} (${euros(balance.expert_payment_cents)})`
              couleur = 'text-slate-500'
            }

            return (
              <div key={answer.id} className="bg-white border border-slate-200 rounded-xl px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-0.5">
                    {answer.requests ? CATEGORY_LABELS[answer.requests.category] : ''} -{' '}
                    {new Date(answer.delivered_at).toLocaleDateString('fr-BE', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {answer.requests?.title ?? 'Demande supprimée'}
                  </p>
                </div>
                <p className={`text-sm font-semibold shrink-0 ${couleur}`}>{statut}</p>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default function GainsPageGuarded() {
  return <ExpertGuard><GainsPage /></ExpertGuard>
}
