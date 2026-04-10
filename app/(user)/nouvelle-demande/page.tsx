'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'

// Initialise Stripe avec la clé publique (côté client uniquement)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ---- Schéma de validation du formulaire ----

const schema = z.object({
  category: z.enum(['mecanique', 'immo', 'travaux', 'assurance', 'travail', 'comptabilite'], {
    message: 'Veuillez choisir une catégorie.',
  }),
  title: z
    .string()
    .min(5, 'Le titre doit faire au moins 5 caractères')
    .max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z.string().min(20, 'La description doit faire au moins 20 caractères'),
})

type FormData = z.infer<typeof schema>

const CATEGORIES = [
  {
    value: 'mecanique',
    label: 'Mécanique automobile',
    description: 'Devis trop cher, panne incomprise, diagnostic douteux...',
    disponible: true,
  },
  {
    value: 'immo',
    label: 'Immobilier',
    description: 'Honoraires d\'agence, mandat de vente, état des lieux...',
    disponible: false,
  },
  {
    value: 'travaux',
    label: 'Travaux',
    description: 'Plombier, électricien, devis gonflé, arnaque artisan...',
    disponible: false,
  },
  {
    value: 'assurance',
    label: 'Assurance',
    description: 'Refus de remboursement, clause cachée, sinistre mal évalué...',
    disponible: false,
  },
  {
    value: 'travail',
    label: 'Droit du travail',
    description: 'Licenciement, heures sup, clause de non-concurrence...',
    disponible: false,
  },
  {
    value: 'comptabilite',
    label: 'Comptabilité',
    description: 'Déclaration INASTI, TVA indépendant, cotisations sociales...',
    disponible: false,
  },
]

const DESCRIPTION_PLACEHOLDER: Record<string, string> = {
  mecanique: 'Véhicule : [marque, modèle, année, km]\nProblème : [description précise de la panne ou du doute]\nDevis : [montant et détail des réparations demandées]',
  immo: 'Type de bien : [appartement, maison...]\nSituation : [achat, vente, location]\nProblème : [décrivez votre doute]',
  travaux: 'Type de travaux : [plomberie, électricité...]\nSurface approximative : [m²]\nDevis : [montant et détail des postes]',
  assurance: 'Type d\'assurance : [auto, habitation, vie...]\nSituation : [décrivez le refus ou le litige]\nMontant en jeu : [montant]',
  travail: 'Situation : [décrivez votre situation professionnelle]\nProblème : [licenciement, heures sup...]\nAncienneté : [durée dans l\'entreprise]',
  comptabilite: 'Statut : [indépendant, société...]\nProblème : [décrivez votre question]\nPériode concernée : [année ou trimestre]',
}

// ---- Composant formulaire de paiement Stripe ----

function FormulaireStripe({ requestId }: { requestId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [tempsRestant, setTempsRestant] = useState(5 * 60) // 5 minutes en secondes

  // Compte à rebours - redirige vers l'accueil si le temps expire (demande sera nettoyée par le cron)
  useEffect(() => {
    const interval = setInterval(() => {
      setTempsRestant((t) => {
        if (t <= 1) {
          clearInterval(interval)
          router.push('/mes-demandes')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [router])

  async function handlePay() {
    if (!stripe || !elements) return

    setLoading(true)
    setErreur('')

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/mes-demandes/${requestId}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      // Traduit les erreurs Stripe en français selon le code de refus
      // La demande reste en DB - l'utilisateur peut réessayer avec une autre carte
      let message = 'Paiement refusé. Vérifiez vos informations de carte.'
      if (error.code === 'expired_card') {
        message = 'Cette carte est expirée.'
      } else if (error.code === 'incorrect_cvc') {
        message = 'Code CVC incorrect.'
      } else if (error.code === 'card_declined') {
        if (error.decline_code === 'insufficient_funds') {
          message = 'Solde insuffisant sur cette carte.'
        } else if (error.decline_code === 'lost_card' || error.decline_code === 'stolen_card') {
          message = 'Cette carte ne peut pas être utilisée.'
        } else {
          message = 'Carte refusée. Essayez avec une autre carte.'
        }
      }
      setErreur(message)
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      // Confirme le paiement en base de données avant de rediriger
      await fetch(`/api/requests/verify-payment?pi_id=${paymentIntent.id}`)
      router.push(`/mes-demandes/${requestId}`)
    }
  }

  const minutes = Math.floor(tempsRestant / 60)
  const secondes = tempsRestant % 60
  const urgent = tempsRestant < 60

  return (
    <div className="space-y-4">

      {/* Compte à rebours */}
      <div className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg ${urgent ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}`}>
        <span>Temps restant pour finaliser le paiement</span>
        <span className="font-bold tabular-nums">
          {minutes}:{secondes.toString().padStart(2, '0')}
        </span>
      </div>

      <PaymentElement />
      {erreur && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {erreur}
        </p>
      )}
      <Button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-6"
      >
        {loading ? 'Paiement en cours...' : 'Payer 9,00 € et envoyer ma question'}
      </Button>
      <p className="text-xs text-center text-slate-400">
        Paiement sécurisé par Stripe. Remboursé automatiquement si aucun expert ne répond sous 24h.
      </p>
    </div>
  )
}

// ---- Page principale en 3 étapes ----

const MAX_SIZE_MB = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB) || 10
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export default function NouvelleDemandePage() {
  const [etape, setEtape] = useState(1)
  const [clientSecret, setClientSecret] = useState('')
  const [requestId, setRequestId] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreurSoumission, setErreurSoumission] = useState('')
  const [fichiers, setFichiers] = useState<File[]>([])
  const [erreurFichier, setErreurFichier] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const categorieSelectionnee = watch('category')
  const descriptionValue = watch('description')

  // Valide et ajoute les fichiers sélectionnés à la liste
  function handleFichiers(e: React.ChangeEvent<HTMLInputElement>) {
    setErreurFichier('')
    const selected = Array.from(e.target.files ?? [])

    for (const file of selected) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setErreurFichier(`"${file.name}" dépasse la taille maximale de ${MAX_SIZE_MB} MB.`)
        return
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErreurFichier(`"${file.name}" n'est pas un format accepté. Formats : JPG, PNG, PDF.`)
        return
      }
    }

    setFichiers((prev) => [...prev, ...selected])
    e.target.value = ''
  }

  // Retire un fichier de la liste
  function retirerFichier(index: number) {
    setFichiers((prev) => prev.filter((_, i) => i !== index))
  }

  // Soumet la demande à l'API, uploade les fichiers, puis affiche le paiement
  async function onSubmit(data: FormData) {
    setLoading(true)
    setErreurSoumission('')

    try {
      // Crée la demande
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        setErreurSoumission(json.error || 'Une erreur est survenue.')
        setLoading(false)
        return
      }

      const newRequestId = json.request.id

      // Uploade les fichiers un par un si l'utilisateur en a sélectionné
      for (const fichier of fichiers) {
        const formData = new FormData()
        formData.append('file', fichier)
        await fetch(`/api/requests/${newRequestId}/upload`, {
          method: 'POST',
          body: formData,
        })
      }

      setClientSecret(json.client_secret)
      setRequestId(newRequestId)
      setEtape(3)
    } catch {
      setErreurSoumission("Une erreur inattendue s'est produite.")
    }

    setLoading(false)
  }

  return (
    <main className="page-container">

      {/* Barre de progression */}
      <div className="flex items-center gap-2 mb-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                i <= etape
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i}
            </div>
            <span className={`text-sm hidden sm:block ${i <= etape ? 'text-slate-800' : 'text-slate-400'}`}>
              {i === 1 ? 'Catégorie' : i === 2 ? 'Description' : 'Paiement'}
            </span>
            {i < 3 && <div className={`h-px flex-1 ${i < etape ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* ---- Étape 1 : Choisir une catégorie ---- */}
      {etape === 1 && (
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Choisissez un domaine</h1>
          <p className="text-slate-500 mb-6 text-sm">
            Une seule catégorie est disponible pour l'instant. D'autres arrivent prochainement.
          </p>

          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                disabled={!cat.disponible}
                onClick={() => {
                  if (!cat.disponible) return
                  setValue('category', cat.value as FormData['category'])
                  setEtape(2)
                }}
                className={`w-full text-left border rounded-xl p-4 transition-all ${
                  categorieSelectionnee === cat.value
                    ? 'border-blue-500 bg-blue-50'
                    : cat.disponible
                    ? 'border-slate-200 hover:border-slate-400 bg-white'
                    : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{cat.label}</p>
                    <p className="text-sm text-slate-500">{cat.description}</p>
                  </div>
                  {cat.disponible ? (
                    <span className="text-blue-700 font-bold text-sm shrink-0 ml-4">9 €</span>
                  ) : (
                    <span className="text-slate-400 text-xs shrink-0 ml-4">Bientôt</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Étape 2 : Décrire la situation ---- */}
      {etape === 2 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Décrivez votre situation</h1>
            <p className="text-slate-500 text-sm mb-6">
              Plus vous donnez de détails, plus la réponse de l'expert sera précise.{' '}
              <a href="/comment-poser-ma-question" className="text-blue-600 underline" target="_blank">
                Voir nos conseils
              </a>
            </p>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Titre de votre question
            </label>
            <input
              {...register('title')}
              placeholder="Ex : Devis de 1 500 € pour changer les freins, est-ce normal ?"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description détaillée
            </label>
            <textarea
              {...register('description')}
              rows={8}
              placeholder={DESCRIPTION_PLACEHOLDER[categorieSelectionnee] ?? 'Décrivez votre situation...'}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-between mt-1">
              {errors.description ? (
                <p className="text-red-500 text-xs">{errors.description.message}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-slate-400">{descriptionValue?.length ?? 0} caractères</p>
            </div>
          </div>

          {/* Zone d'upload de fichiers */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pièces jointes <span className="text-slate-400">(optionnel)</span>
            </label>
            <p className="text-xs text-slate-400 mb-2">
              JPG, PNG, PDF - maximum {MAX_SIZE_MB} MB par fichier. Joignez une photo du devis, un document, etc.
            </p>

            {/* Bouton d'ajout de fichier */}
            <label className="inline-flex items-center gap-2 cursor-pointer border border-dashed border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-600 hover:border-slate-500 hover:bg-slate-50 transition-colors">
              <span>+ Ajouter un fichier</span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFichiers}
                className="hidden"
              />
            </label>

            {erreurFichier && (
              <p className="text-red-500 text-xs mt-2">{erreurFichier}</p>
            )}

            {/* Liste des fichiers sélectionnés */}
            {fichiers.length > 0 && (
              <ul className="mt-3 space-y-2">
                {fichiers.map((f, i) => (
                  <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <span className="truncate text-slate-700">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => retirerFichier(i)}
                      className="text-slate-400 hover:text-red-500 ml-3 shrink-0 text-xs"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {erreurSoumission && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {erreurSoumission}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEtape(1)}
            >
              Retour
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Préparation...' : 'Continuer vers le paiement'}
            </Button>
          </div>
        </form>
      )}

      {/* ---- Étape 3 : Paiement Stripe ---- */}
      {etape === 3 && clientSecret && (
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Paiement</h1>
          <p className="text-slate-500 text-sm mb-6">
            9,00 € - Remboursé automatiquement si aucun expert ne répond sous 24h.
          </p>

          <Elements
            stripe={stripePromise}
            options={{ clientSecret, locale: 'fr' }}
          >
            <FormulaireStripe requestId={requestId} />
          </Elements>
        </div>
      )}

    </main>
  )
}
