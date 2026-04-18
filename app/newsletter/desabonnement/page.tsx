'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Affiche le résultat du désabonnement selon le paramètre reçu dans l'URL
// Le désabonnement réel est effectué par GET /api/newsletter/unsubscribe?token=xxx
// Cette page est juste la landing après la redirection
function ContenuDesabonnement() {
  const searchParams = useSearchParams()
  const confirme = searchParams.get('confirme') === '1'
  const erreur   = searchParams.get('erreur')

  // Efface le flag localStorage pour permettre une future réinscription
  useEffect(() => {
    if (confirme) {
      localStorage.removeItem('newsletter_inscrit')
    }
  }, [confirme])

  if (confirme) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Désabonnement confirmé
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Votre adresse email a bien été retirée de notre liste newsletter. Vous ne recevrez plus nos emails.
        </p>
        <Link href="/blog" className="text-indigo-600 hover:underline text-sm">
          Retour au blog
        </Link>
      </div>
    )
  }

  if (erreur) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Lien invalide ou expiré
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Ce lien de désabonnement ne fonctionne pas. Il est possible que vous soyez déjà désabonné,
          ou que le lien ait été altéré.
        </p>
        <p className="text-slate-400 text-xs">
          Si vous continuez à recevoir des emails, contactez-nous à{' '}
          <a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL_CONTACT ?? 'contact@avisbox.be'}`} className="text-indigo-600 hover:underline">
            contact@avisbox.be
          </a>.
        </p>
      </div>
    )
  }

  // Accès direct sans token ni confirmation - on explique comment ça fonctionne
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
        Désabonnement newsletter
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
        Pour vous désabonner, cliquez sur le lien de désabonnement présent en bas de chaque email newsletter que vous avez reçu.
      </p>
      <p className="text-slate-400 text-xs">
        Si vous ne trouvez pas ce lien, contactez-nous directement à{' '}
        <a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL_CONTACT ?? 'contact@avisbox.be'}`} className="text-indigo-600 hover:underline">
          contact@avisbox.be
        </a>{' '}
        avec votre adresse email et nous nous en chargeons.
      </p>
    </div>
  )
}

export default function DesabonnementPage() {
  return (
    <main className="page-container py-20">
      <div className="max-w-md mx-auto">
        <Suspense>
          <ContenuDesabonnement />
        </Suspense>
      </div>
    </main>
  )
}
