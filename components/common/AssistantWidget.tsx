'use client'

import { useState } from 'react'
import Image from 'next/image'

// Questions fréquentes organisées par catégorie pour l'assistant d'aide
const FAQ_CATEGORIES = [
  {
    titre: 'Fonctionnement',
    questions: [
      {
        q: 'Comment ca marche ?',
        r: 'Vous décrivez votre situation, effectuez un paiement sécurisé, puis un expert vérifié vous répond sous 24h. Si aucune réponse n\'est apportée dans ce délai, vous êtes automatiquement remboursé.',
      },
      {
        q: 'Combien ca coute ?',
        r: 'Chaque demande est proposée à un tarif fixe, quel que soit le sujet. Ce tarif inclut une réponse complète d\'un expert vérifié.',
      },
      {
        q: 'En combien de temps je recois ma réponse ?',
        r: 'Nos experts s\'engagent à répondre sous 24h. Si vous ne recevez pas de réponse dans ce délai, vous êtes remboursé automatiquement.',
      },
      {
        q: 'Et si la réponse ne me convient pas ?',
        r: 'Vous disposez de 48h après réception pour signaler une réponse. Notre équipe analyse le dossier et décide d\'un remboursement si nécessaire.',
      },
    ],
  },
  {
    titre: 'Paiement',
    questions: [
      {
        q: 'Comment je paie ?',
        r: 'Le paiement se fait par carte bancaire via Stripe, une plateforme de paiement sécurisée. Vos données bancaires ne sont jamais stockées sur nos serveurs.',
      },
      {
        q: 'Quand suis-je remboursé ?',
        r: 'Si aucun expert ne répond dans le délai prévu, vous êtes automatiquement remboursé. En cas de signalement validé, un remboursement est également effectué.',
      },
    ],
  },
  {
    titre: 'Experts',
    questions: [
      {
        q: 'Qui sont les experts ?',
        r: 'Ce sont des professionnels vérifiés : mécaniciens, agents immobiliers, artisans, etc. Chaque expert est validé manuellement par notre équipe avant de pouvoir répondre.',
      },
      {
        q: 'Je suis un professionnel, comment devenir expert ?',
        r: 'Rendez-vous sur la page "Devenir expert" pour soumettre votre candidature. Vous devrez fournir un justificatif de votre expertise (diplome, numéro BCE, etc.).',
      },
    ],
  },
  {
    titre: 'Mon compte',
    questions: [
      {
        q: 'Comment supprimer mon compte ?',
        r: 'Connectez-vous, allez dans "Mon compte", puis cliquez sur "Supprimer mon compte" dans la section en bas de page. Vos données seront anonymisées conformément au RGPD.',
      },
      {
        q: 'J\'ai oublié mon mot de passe',
        r: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Vous recevrez un lien par email pour le réinitialiser.',
      },
    ],
  },
]

// Widget d'assistance flottant - bouton en bas à droite qui ouvre une chatbox FAQ
export default function AssistantWidget() {
  const [ouvert, setOuvert]             = useState(false)
  const [reponseActive, setReponseActive] = useState<string | null>(null)

  return (
    <>
      {/* Chatbox */}
      {ouvert && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-h-[70vh] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">

          {/* En-tête */}
          <div className="bg-slate-700 border-b border-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
            <div>
              <p className="font-semibold text-sm text-white">Besoin d'aide ?</p>
              <p className="text-xs text-slate-200">Trouvez votre réponse ci-dessous</p>
            </div>
            <button
              onClick={() => { setOuvert(false); setReponseActive(null) }}
              className="text-slate-200 hover:text-white text-lg leading-none"
              aria-label="Fermer l'assistant"
            >
              ×
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Si une réponse est affichée */}
            {reponseActive !== null ? (
              <div className="space-y-3">
                <button
                  onClick={() => setReponseActive(null)}
                  className="text-xs text-indigo-600 dark:text-green-400 hover:text-indigo-700 dark:hover:text-green-300 flex items-center gap-1"
                >
                  ← Retour aux questions
                </button>
                <div className="bg-indigo-50 dark:bg-green-900/30 rounded-xl p-3 text-sm text-slate-700 dark:text-green-200 leading-relaxed">
                  {reponseActive}
                </div>
              </div>
            ) : (
              /* Liste des catégories et questions */
              FAQ_CATEGORIES.map((cat) => (
                <div key={cat.titre}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    {cat.titre}
                  </p>
                  <div className="space-y-1">
                    {cat.questions.map((faq) => (
                      <button
                        key={faq.q}
                        onClick={() => setReponseActive(faq.r)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-green-900/30 hover:text-indigo-700 dark:hover:text-green-200 rounded-lg transition-colors"
                      >
                        {faq.q}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pied de page */}
          <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2 text-center shrink-0">
            <p className="text-xs text-slate-400">
              Autre question ? Ecrivez-nous à{' '}
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_EMAIL_CONTACT ?? 'contact@avisbox.be'}`}
                className="text-indigo-600 dark:text-green-400 hover:underline"
              >
                contact@avisbox.be
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Bouton flottant - utilise le logo robot du projet */}
      <button
        onClick={() => { setOuvert(!ouvert); setReponseActive(null) }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 focus:ring-offset-2 overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        aria-label={ouvert ? "Fermer l'assistant" : "Ouvrir l'assistant"}
      >
        <Image
          src="/robot-aide.png"
          alt="Besoin d'aide ?"
          width={56}
          height={56}
          loading="eager"
          className="w-full h-full object-cover"
        />
      </button>
    </>
  )
}
