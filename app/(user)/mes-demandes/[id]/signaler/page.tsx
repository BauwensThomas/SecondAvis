'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const RAISONS = [
  { value: 'vague',        label: 'Réponse vague ou inutile' },
  { value: 'incorrecte',  label: 'Informations incorrectes ou douteuses' },
  { value: 'solicitation', label: 'Sollicitation commerciale inappropriée' },
  { value: 'abusif',      label: 'Contenu offensant ou abusif' },
  { value: 'autre',       label: 'Autre' },
]

// Page de signalement d'une réponse - accessible uniquement dans les 48h après réception
export default function SignalerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [raison, setRaison] = useState('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!raison) {
      setErreur('Veuillez choisir une raison.')
      return
    }

    setLoading(true)
    setErreur('')

    // Récupère l'ID de la réponse depuis l'API de la demande
    const reqRes = await fetch(`/api/requests/${id}`)
    const reqData = await reqRes.json()

    if (!reqRes.ok || !reqData.answer) {
      setErreur('Impossible de trouver la réponse associée.')
      setLoading(false)
      return
    }

    const answerId = reqData.answer.id

    const res = await fetch(`/api/answers/${answerId}/contest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: raison, details }),
    })

    const json = await res.json()

    if (!res.ok) {
      setErreur(json.error || 'Une erreur est survenue.')
      setLoading(false)
      return
    }

    // Redirige vers la demande avec le nouveau statut 'contested'
    router.push(`/mes-demandes/${id}`)
  }

  return (
    <main className="page-container">
      <Link href={`/mes-demandes/${id}`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Retour à ma demande
      </Link>

      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Signaler cette réponse</h1>
        <p className="text-sm text-slate-500 mb-6">
          Votre signalement sera examiné par notre équipe. Tout paiement est suspendu
          jusqu'à notre décision.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Choix de la raison */}
          <div className="space-y-2">
            {RAISONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  raison === r.value
                    ? 'border-red-400 bg-red-50'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="raison"
                  value={r.value}
                  checked={raison === r.value}
                  onChange={() => setRaison(r.value)}
                  className="text-red-600"
                />
                <span className="text-sm text-slate-800">{r.label}</span>
              </label>
            ))}
          </div>

          {/* Détails supplémentaires */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Précisions <span className="text-slate-400">(optionnel)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Décrivez le problème en détail..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>

          {erreur && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {erreur}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href={`/mes-demandes/${id}`}>Annuler</Link>
            </Button>
            <Button
              type="submit"
              disabled={loading || !raison}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Envoi...' : 'Confirmer le signalement'}
            </Button>
          </div>

        </form>
      </div>
    </main>
  )
}
