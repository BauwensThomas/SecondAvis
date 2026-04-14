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
  { value: 'mecanique',    label: 'Mécanique automobile', description: 'Devis trop cher, panne incomprise, diagnostic douteux...' },
  { value: 'immo',         label: 'Immobilier',            description: 'Honoraires d\'agence, mandat de vente, état des lieux...' },
  { value: 'travaux',      label: 'Travaux',               description: 'Plombier, électricien, devis gonflé, arnaque artisan...' },
  { value: 'assurance',    label: 'Assurance',             description: 'Refus de remboursement, clause cachée, sinistre mal évalué...' },
  { value: 'travail',      label: 'Droit du travail',      description: 'Licenciement, heures sup, clause de non-concurrence...' },
  { value: 'comptabilite', label: 'Comptabilité',          description: 'Déclaration INASTI, TVA indépendant, cotisations sociales...' },
]

// Récupère les prix dynamiques depuis les variables d'environnement
const CATEGORY_PRICES: Record<string, number> = {
  mecanique: Number(process.env.NEXT_PUBLIC_PRICE_MECANIQUE_CENTS) || 900,
  immo: Number(process.env.NEXT_PUBLIC_PRICE_IMMO_CENTS) || 900,
  travaux: Number(process.env.NEXT_PUBLIC_PRICE_TRAVAUX_CENTS) || 900,
  assurance: Number(process.env.NEXT_PUBLIC_PRICE_ASSURANCE_CENTS) || 900,
  travail: Number(process.env.NEXT_PUBLIC_PRICE_TRAVAIL_CENTS) || 900,
  comptabilite: Number(process.env.NEXT_PUBLIC_PRICE_COMPTABILITE_CENTS) || 900,
}

const MIN_EXPERTS_PAR_CATEGORIE = 2

const DESCRIPTION_PLACEHOLDER: Record<string, string> = {
  mecanique: 'Véhicule : [marque, modèle, année, km]\nProblème : [description précise de la panne ou du doute]\nDevis : [montant et détail des réparations demandées]',
  immo: 'Type de bien : [appartement, maison...]\nSituation : [achat, vente, location]\nProblème : [décrivez votre doute]',
  travaux: 'Type de travaux : [plomberie, électricité...]\nSurface approximative : [m²]\nDevis : [montant et détail des postes]',
  assurance: 'Type d\'assurance : [auto, habitation, vie...]\nSituation : [décrivez le refus ou le litige]\nMontant en jeu : [montant]',
  travail: 'Situation : [décrivez votre situation professionnelle]\nProblème : [licenciement, heures sup...]\nAncienneté : [durée dans l\'entreprise]',
  comptabilite: 'Statut : [indépendant, société...]\nProblème : [décrivez votre question]\nPériode concernée : [année ou trimestre]',
}

// ---- Composant formulaire de paiement Stripe ----

function FormulaireStripe({ requestId, category }: { requestId: string, category: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  // Récupère les prix dynamiques depuis les variables d'environnement
  const CATEGORY_PRICES: Record<string, number> = {
    mecanique: Number(process.env.NEXT_PUBLIC_PRICE_MECANIQUE_CENTS) || 900,
    immo: Number(process.env.NEXT_PUBLIC_PRICE_IMMO_CENTS) || 900,
    travaux: Number(process.env.NEXT_PUBLIC_PRICE_TRAVAUX_CENTS) || 900,
    assurance: Number(process.env.NEXT_PUBLIC_PRICE_ASSURANCE_CENTS) || 900,
    travail: Number(process.env.NEXT_PUBLIC_PRICE_TRAVAIL_CENTS) || 900,
    comptabilite: Number(process.env.NEXT_PUBLIC_PRICE_COMPTABILITE_CENTS) || 900,
  }
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
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base py-6"
      >
        {loading
          ? 'Paiement en cours...'
          : `Payer ${(CATEGORY_PRICES[category] / 100).toFixed(2).replace('.', ',')} € et envoyer ma question`}
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
  const [expertsParCategorie, setExpertsParCategorie] = useState<Record<string, number>>({})
  const [estAdmin, setEstAdmin] = useState(false)

  // Charge le nombre d'experts actifs par catégorie et le rôle de l'utilisateur
  useEffect(() => {
    fetch('/api/stats/categories')
      .then((r) => r.json())
      .then((data) => setExpertsParCategorie(data.categories ?? {}))
      .catch(() => {})

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setEstAdmin(data.role === 'admin'))
      .catch(() => {})
  }, [])

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

      {/* Stepper parfaitement aligné (identique à devenir-expert) */}
      <div className="relative flex items-center justify-between mb-10 w-full px-2">
        {/* Étape 1 */}
        <div className="flex flex-col items-center min-w-[80px]">
          <div className={`w-8 h-8 rounded-full text-base font-bold flex items-center justify-center ${
            etape === 1 ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
            etape > 1 ? 'bg-indigo-600 text-white' :
            'bg-slate-200 text-slate-500'
          }`}>1</div>
          <span className={`text-xs font-medium mt-2 ${etape === 1 ? 'text-indigo-700' : 'text-slate-400'}`}>Catégorie</span>
        </div>
        {/* Trait entre 1 et 2 */}
        <div className="flex-1 h-0.5 bg-slate-200" />
        {/* Étape 2 */}
        <div className="flex flex-col items-center min-w-[80px]">
          <div className={`w-8 h-8 rounded-full text-base font-bold flex items-center justify-center ${
            etape === 2 ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
            etape > 2 ? 'bg-indigo-600 text-white' :
            'bg-slate-200 text-slate-500'
          }`}>2</div>
          <span className={`text-xs font-medium mt-2 ${etape === 2 ? 'text-indigo-700' : 'text-slate-400'}`}>Description</span>
        </div>
        {/* Trait entre 2 et 3 */}
        <div className="flex-1 h-0.5 bg-slate-200" />
        {/* Étape 3 */}
        <div className="flex flex-col items-center min-w-[80px]">
          <div className={`w-8 h-8 rounded-full text-base font-bold flex items-center justify-center ${
            etape === 3 ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
            'bg-slate-200 text-slate-500'
          }`}>3</div>
          <span className={`text-xs font-medium mt-2 ${etape === 3 ? 'text-indigo-700' : 'text-slate-400'}`}>Paiement</span>
        </div>
      </div>

      {/* ---- Étape 1 : Choisir une catégorie ---- */}
      {etape === 1 && (
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Choisissez un domaine</h1>
          <p className="text-slate-500 mb-6 text-sm">
            Sélectionnez la catégorie qui correspond à votre situation.
          </p>

          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const nbExperts = expertsParCategorie[cat.value] ?? 0
              const accessible = estAdmin || nbExperts >= MIN_EXPERTS_PAR_CATEGORIE

              return (
                <button
                  key={cat.value}
                  type="button"
                  disabled={!accessible}
                  onClick={() => {
                    if (!accessible) return
                    setValue('category', cat.value as FormData['category'])
                    setEtape(2)
                  }}
                  className={`w-full text-left border rounded-xl p-4 transition-all ${
                    categorieSelectionnee === cat.value
                      ? 'border-blue-500 bg-blue-50'
                      : accessible
                      ? 'border-slate-200 hover:border-slate-400 bg-white'
                      : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{cat.label}</p>
                      <p className="text-sm text-slate-500">{cat.description}</p>
                      {!accessible && (
                        <p className="text-xs text-orange-500 mt-1">
                          Pas encore disponible - pas assez d'experts dans cette catégorie
                        </p>
                      )}
                    </div>
                    {accessible ? (
                      <span className="text-blue-700 font-bold text-sm shrink-0 ml-4">
                        {(CATEGORY_PRICES[cat.value] / 100).toFixed(2).replace('.', ',')} €
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs shrink-0 ml-4">Bientôt</span>
                    )}
                  </div>
                </button>
              )
            })}
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
              <a href="/comment-poser-ma-question" className="text-indigo-700 dark:text-green-400 font-semibold hover:text-indigo-900 dark:hover:text-green-300 focus:outline-none" target="_blank">
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

          <div className="flex flex-row gap-4 items-center justify-start mt-6">
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg min-w-[220px] flex items-center justify-center text-base font-semibold"
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
            {(CATEGORY_PRICES[categorieSelectionnee] / 100).toFixed(2).replace('.', ',')} € - Remboursé automatiquement si aucun expert ne répond sous 24h.
          </p>

          <Elements
            stripe={stripePromise}
            options={{ clientSecret, locale: 'fr' }}
          >
            <FormulaireStripe requestId={requestId} category={categorieSelectionnee} />
          </Elements>
        </div>
      )}

    </main>
  )
}
