'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import ExpertGuard from '@/components/layout/ExpertGuard'

interface Demande {
  id: string
  category: string
  title: string
  description: string
  attachments: string[]
  created_at: string
  expires_at: string
}

const answerSchema = z.object({
  verdict: z.string().min(5, 'Le verdict doit faire au moins 5 caractères').max(200),
  content: z.string().min(50, 'La réponse doit faire au moins 50 caractères'),
})

type AnswerForm = z.infer<typeof answerSchema>

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

// Affiche le temps restant en format lisible
function tempsRestant(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expirée'
  const heures = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${heures}h ${minutes}min`
}

// Page de détail d'une demande pour l'expert - affiche la demande et le formulaire de réponse
function ExpertDemandePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [soumission, setSoumission] = useState(false)
  const [erreurSoumission, setErreurSoumission] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AnswerForm>({
    resolver: zodResolver(answerSchema),
  })

  const contenuValue = watch('content')
  const [tempsVerrou, setTempsVerrou] = useState(10 * 60) // 10 minutes en secondes

  useEffect(() => {
    // Pose le verrou sur la demande dès l'ouverture de la page
    fetch(`/api/expert/requests/${id}/lock`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setErreur(data.error)
          setLoading(false)
          return
        }
        // Charge les détails de la demande après avoir posé le verrou
        return fetch('/api/expert/requests')
          .then((r) => r.json())
          .then((data) => {
            const found = (data.requests ?? []).find((r: Demande) => r.id === id)
            if (!found) setErreur('Cette demande est introuvable ou a déjà été prise en charge.')
            else setDemande(found)
            setLoading(false)
          })
      })
      .catch(() => {
        setErreur('Impossible de charger cette demande.')
        setLoading(false)
      })

    // Libère le verrou si l'expert quitte la page sans répondre
    return () => {
      fetch(`/api/expert/requests/${id}/lock`, { method: 'DELETE' })
    }
  }, [id])

  // Compte à rebours de 10 minutes - redirige vers le dashboard si le temps expire
  useEffect(() => {
    const interval = setInterval(() => {
      setTempsVerrou((t) => {
        if (t <= 1) {
          clearInterval(interval)
          router.push('/expert/dashboard')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [router])

  // Envoie la réponse à l'API
  async function onSubmit(data: AnswerForm) {
    setSoumission(true)
    setErreurSoumission('')

    const res = await fetch(`/api/expert/requests/${id}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()

    if (!res.ok) {
      setErreurSoumission(json.error || 'Erreur lors de la soumission.')
      setSoumission(false)
      return
    }

    router.push('/expert/dashboard')
  }

  if (loading) {
    return (
      <main className="page-container space-y-4">
        <div className="h-8 bg-slate-100 rounded animate-pulse w-48" />
        <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </main>
    )
  }

  if (erreur || !demande) {
    return (
      <main className="page-container text-center">
        <p className="text-red-600 mb-4">{erreur || 'Demande introuvable.'}</p>
        <Button asChild variant="outline">
          <Link href="/expert/dashboard">Retour au tableau de bord</Link>
        </Button>
      </main>
    )
  }

  const restant = tempsRestant(demande.expires_at)
  const urgent = new Date(demande.expires_at).getTime() - Date.now() < 6 * 60 * 60 * 1000

  return (
    <main className="page-container space-y-6">

      <div className="mb-2">
        <Link
          href="/expert/dashboard"
          className="block w-fit bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium transition-colors"
        >
          ← Retour au tableau de bord
        </Link>
      </div>

      {/* Timer expiration demande client - harmonisé et texte plus foncé */}
      <div
        className={`rounded-xl px-4 py-3 text-sm mb-6 flex flex-col gap-1
          ${urgent
            ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/60 dark:border-red-700 dark:text-red-200'
            : 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/80 dark:border-yellow-700 dark:text-yellow-100'}
        `}
      >
        <span className="font-semibold">
          Temps restant avant expiration de la demande : {restant}
        </span>
        <span className="text-xs font-semibold">
          Si personne ne répond avant l'expiration, le client est remboursé automatiquement.
        </span>
      </div>

      {/* Timer verrou - harmonisé avec la carte "Connecté en tant que... Mon compte" */}
      {(() => {
        const minutes = Math.floor(tempsVerrou / 60)
        const secondes = tempsVerrou % 60
        const verrouUrgent = tempsVerrou < 120
        return (
          <div
            className={`rounded-xl px-4 py-3 text-sm mb-6 flex items-center justify-between
              ${verrouUrgent
                ? 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/60 dark:border-red-700 dark:text-red-200'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-800 dark:bg-indigo-900/80 dark:border-indigo-700 dark:text-indigo-100'}
            `}
          >
            <span className="font-semibold">
              Cette demande vous est réservée pendant
            </span>
            <span className="text-lg font-bold tabular-nums">
              {minutes}:{secondes.toString().padStart(2, '0')}
            </span>
          </div>
        )
      })()}

      {/* Demande originale */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <p className="text-xs text-slate-400 mb-1">
          {CATEGORY_LABELS[demande.category] ?? demande.category} -{' '}
          {new Date(demande.created_at).toLocaleDateString('fr-BE', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
        <h1 className="text-xl font-bold text-slate-900 mb-4">{demande.title}</h1>
        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
          {demande.description}
        </p>

        {/* Pièces jointes */}
        {demande.attachments && demande.attachments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            {demande.attachments.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline"
              >
                Pièce jointe {i + 1}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Formulaire de réponse */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-800">Votre réponse</h2>

        {/* Verdict */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Verdict en 1 phrase
            <span className="text-slate-400 font-normal ml-1">(affiché en premier au client)</span>
          </label>
          <input
            {...register('verdict')}
            placeholder="Ex : Ce devis est surévalué d'environ 30%, la réparation devrait coûter 800-900 €."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.verdict && (
            <p className="text-red-500 text-xs mt-1">{errors.verdict.message}</p>
          )}
        </div>

        {/* Réponse complète */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Réponse complète
          </label>
          <textarea
            {...register('content')}
            rows={10}
            placeholder="Donnez votre avis professionnel détaillé. Expliquez votre raisonnement, mentionnez les points importants, et donnez des conseils concrets au client."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between mt-1">
            {errors.content ? (
              <p className="text-red-500 text-xs">{errors.content.message}</p>
            ) : (
              <span />
            )}
            <p className="text-xs text-slate-400">{contenuValue?.length ?? 0} caractères</p>
          </div>
        </div>

        {/* Rappel charte */}
        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
          En soumettant cette réponse, vous confirmez respecter la charte Avisbox :
          pas de sollicitation commerciale, pas de conseil illégal, informations honnêtes et vérifiables.
        </p>

        {erreurSoumission && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {erreurSoumission}
          </p>
        )}

        <Button
          type="submit"
          disabled={soumission}
          className="w-full rounded-xl px-4 py-3 text-sm mt-2 font-semibold
            bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-900 focus:ring-2 focus:ring-indigo-300 shadow-none
            dark:bg-indigo-900/80 dark:text-indigo-100 dark:border-indigo-700 dark:hover:bg-indigo-800 dark:hover:text-white"
        >
          {soumission ? 'Envoi en cours...' : 'Envoyer ma réponse'}
        </Button>
      </form>

    </main>
  )
}

export default function ExpertDemandePageGuarded() {
  return (
    <ExpertGuard>
      <ExpertDemandePage />
    </ExpertGuard>
  )
}
