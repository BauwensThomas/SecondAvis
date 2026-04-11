'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Demande {
  id: string
  category: string
  title: string
  description: string
  status: string
  amount_cents: number
  created_at: string
  expires_at: string
  attachments: string[]
}

interface Reponse {
  id: string
  content: string
  verdict: string | null
  delivered_at: string
  contest_window_ends: string
  is_contested: boolean
  is_paid: boolean
  contest_decision: 'validate' | 'refund' | null
  contest_resolved: boolean
  admin_decision_at: string | null
  experts: {
    id: string
    display_name: string
    city: string
    average_rating: number
    total_answers: number
  }
}

const STATUS_MESSAGES: Record<string, { label: string; message: string; className: string }> = {
  pending: {
    label: 'En attente',
    message: "Votre demande est en cours d'analyse par nos experts. Vous recevrez une notification dès qu'un expert vous répond.",
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
  answered: {
    label: 'Réponse reçue',
    message: "Un expert a répondu à votre demande. Vous pouvez consulter sa réponse ci-dessous.",
    className: 'bg-green-50 border-green-200 text-green-800',
  },
  contested: {
    label: 'Signalement en cours',
    message: "Votre signalement a été enregistré. Cette demande est en cours d'analyse par notre équipe. Tout paiement est suspendu jusqu'à notre décision.",
    className: 'bg-orange-50 border-orange-200 text-orange-800',
  },
  refunded: {
    label: 'Remboursé',
    message: "Vous avez été remboursé. Vous pouvez soumettre une nouvelle demande quand vous le souhaitez.",
    className: 'bg-slate-50 border-slate-200 text-slate-600',
  },
  closed: {
    label: 'Terminé',
    message: 'Cette demande est terminée.',
    className: 'bg-slate-50 border-slate-200 text-slate-600',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

// Page de détail d'une demande - affiche la demande, la réponse et les actions disponibles
export default function DemandeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [demande, setDemande]       = useState<Demande | null>(null)
  const [reponse, setReponse]       = useState<Reponse | null>(null)
  const [ratingExistant, setRatingExistant] = useState<{ score: number; comment: string | null } | null>(null)
  const [loading, setLoading]       = useState(true)
  const [erreur, setErreur]         = useState('')
  const [modeAccepte, setModeAccepte]     = useState(false)
  const [noteChoisie, setNoteChoisie]     = useState(0)
  const [commentaire, setCommentaire]     = useState('')
  const [ratingEnvoi, setRatingEnvoi]     = useState(false)
  const [ratingSuccess, setRatingSuccess] = useState('')
  const [ratingErreur, setRatingErreur]   = useState('')

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setErreur(data.error)
        else {
          setDemande(data.request)
          setReponse(data.answer)
          setRatingExistant(data.rating ?? null)
        }
        setLoading(false)
      })
      .catch(() => {
        setErreur('Impossible de charger cette demande.')
        setLoading(false)
      })
  }, [id])

  // Soumet la note de l'expert
  async function onSoumettrNote() {
    if (!reponse || noteChoisie === 0) return
    setRatingEnvoi(true)
    setRatingErreur('')

    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer_id: reponse.id, score: noteChoisie, comment: commentaire || undefined }),
    })

    const json = await res.json()
    if (!res.ok) {
      setRatingErreur(json.error || 'Erreur lors de l\'envoi.')
    } else {
      setRatingSuccess('Merci pour votre avis !')
      setRatingExistant({ score: noteChoisie, comment: commentaire || null })
      // Met à jour la moyenne affichée sans recharger toute la page
      if (reponse && json.average_rating !== undefined) {
        setReponse((prev) => prev ? {
          ...prev,
          experts: { ...prev.experts, average_rating: json.average_rating },
        } : prev)
      }
    }
    setRatingEnvoi(false)
  }

  if (loading) {
    return (
      <main className="page-container">
        <div className="space-y-4">
          <div className="h-8 bg-slate-100 rounded animate-pulse w-48" />
          <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-40 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </main>
    )
  }

  if (erreur || !demande) {
    return (
      <main className="page-container text-center">
        <p className="text-red-600 mb-4">{erreur || 'Demande introuvable.'}</p>
        <Button asChild variant="outline">
          <Link href="/mes-demandes">Retour à mes demandes</Link>
        </Button>
      </main>
    )
  }

  const statut = STATUS_MESSAGES[demande.status] ?? STATUS_MESSAGES.closed

  // Vérifie si la fenêtre de signalement de 48h est encore ouverte
  const peutSignaler =
    reponse &&
    !reponse.is_contested &&
    demande.status === 'answered' &&
    new Date(reponse.contest_window_ends) > new Date()

  return (
    <main className="page-container space-y-6">

      {/* Retour */}
      <Link href="/mes-demandes" className="text-sm text-slate-500 hover:text-slate-800">
        ← Retour à mes demandes
      </Link>

      {/* Bandeau statut */}
      <div className={`border rounded-xl p-4 ${statut.className}`}>
        <p className="font-semibold text-sm mb-1">{statut.label}</p>
        <p className="text-sm">{statut.message}</p>
      </div>

      {/* Demande originale */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-400">{CATEGORY_LABELS[demande.category] ?? demande.category}</p>
          <p className="text-xs text-slate-400">
            {new Date(demande.created_at).toLocaleString('fr-BE', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <p className="text-xs text-slate-400 mb-1">Titre de votre question</p>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4">
          <p className="text-sm text-slate-700">{demande.title}</p>
        </div>
        <p className="text-xs text-slate-400 mb-1">Description détaillée</p>
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
          <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
            {demande.description}
          </p>
        </div>

        {/* Pièces jointes */}
        {demande.attachments && demande.attachments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {demande.attachments.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline"
              >
                Fichier {i + 1}
              </a>
            ))}
          </div>
        )}

        {/* Bouton reçu PDF - en bas à droite du cadre */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <a
            href={`/api/requests/${demande.id}/receipt`}
            download
            className="text-xs text-slate-400 underline hover:text-slate-700"
          >
            Télécharger mon reçu (PDF)
          </a>
        </div>
      </div>

      {/* Réponse de l'expert */}
      {reponse && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400">Réponse de l'expert</p>
            <p className="text-xs text-slate-400">
              {new Date(reponse.delivered_at).toLocaleString('fr-BE', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="mb-4">
            <Link
              href={`/experts/${reponse.experts?.id}`}
              className="font-semibold text-slate-800 hover:text-blue-600 hover:underline"
            >
              {reponse.experts?.display_name}
            </Link>
            <p className="text-xs text-slate-400">
              {reponse.experts?.city} - {reponse.experts?.total_answers} réponses -{' '}
              {reponse.experts?.average_rating?.toFixed(1)}/5
            </p>
          </div>

          {/* Verdict en 1 phrase - affiché en premier */}
          {reponse.verdict && (
            <>
              <p className="text-xs text-slate-400 mb-1">Verdict en 1 phrase</p>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-slate-700">{reponse.verdict}</p>
              </div>
            </>
          )}

          <p className="text-xs text-slate-400 mb-1">Réponse complète</p>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {reponse.content}
            </p>
          </div>

          {/* Mention légale obligatoire */}
          <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
            Avisbox est une plateforme d'entraide. Cet avis ne constitue pas une consultation
            professionnelle formelle et n'engage pas la responsabilité de Avisbox.
          </p>

          {/* ---- Zone action client ---- */}
          <div className="mt-4 pt-4 border-t border-slate-100">

            {/* Note déjà soumise - affichage lecture seule */}
            {ratingExistant && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Votre note</p>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-lg">
                    {'★'.repeat(ratingExistant.score)}{'☆'.repeat(5 - ratingExistant.score)}
                  </span>
                  {ratingExistant.comment && (
                    <span className="text-xs text-slate-500">"{ratingExistant.comment}"</span>
                  )}
                </div>
              </div>
            )}

            {/* Choix initial - deux boutons - visible si pas encore noté, sauf si signalement validé (formulaire direct) */}
            {!ratingExistant && !modeAccepte && demande.status === 'answered' && reponse.contest_decision !== 'validate' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Que pensez-vous de cette réponse ?</p>
                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setModeAccepte(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    La réponse me convient
                  </Button>
                  {peutSignaler && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      asChild
                    >
                      <Link href={`/mes-demandes/${demande.id}/signaler`}>
                        Signaler un problème
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Formulaire étoiles - affiché après clic sur "convient" ou après validation admin */}
            {!ratingExistant && (modeAccepte || reponse.contest_decision === 'validate') && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  {reponse.contest_decision === 'validate' ? (
                    <>
                      Notre équipe a validé cette réponse
                      {reponse.admin_decision_at && (
                        <> le {new Date(reponse.admin_decision_at).toLocaleString('fr-BE', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}</>
                      )}
                      . Vous pouvez maintenant la noter.
                    </>
                  ) : 'Notez la réponse de l\'expert'}
                </p>

                {/* Étoiles cliquables */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((etoile) => (
                    <button
                      key={etoile}
                      type="button"
                      onClick={() => setNoteChoisie(etoile)}
                      className={`text-2xl transition-colors ${
                        etoile <= noteChoisie ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {noteChoisie > 0 && (
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Commentaire optionnel..."
                    rows={2}
                    maxLength={500}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}

                {ratingErreur && <p className="text-red-500 text-xs">{ratingErreur}</p>}
                {ratingSuccess && <p className="text-green-600 text-xs">{ratingSuccess}</p>}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={noteChoisie === 0 || ratingEnvoi}
                    onClick={onSoumettrNote}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {ratingEnvoi ? 'Envoi...' : 'Envoyer ma note'}
                  </Button>
                  {modeAccepte && reponse.contest_decision !== 'validate' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setModeAccepte(false)}
                    >
                      Retour
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  )
}
