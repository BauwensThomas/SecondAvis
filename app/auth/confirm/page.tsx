'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Page affichée après inscription - demande de confirmer l'email
// Propose également de renvoyer l'email si non reçu
export default function ConfirmPage() {
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [renvoyé, setRenvoyé]           = useState(false)
  const [erreur, setErreur]             = useState('')

  // Demande à Supabase de renvoyer l'email de confirmation
  async function renvoyer() {
    setEnvoiEnCours(true)
    setErreur('')
    try {
      const res  = await fetch('/api/auth/resend-confirmation', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setErreur(data.error ?? 'Erreur lors du renvoi.')
      else setRenvoyé(true)
    } catch {
      setErreur('Erreur inattendue. Réessayez.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <Link href="/" className="text-2xl font-bold text-slate-900">
          SecondAvis
        </Link>

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">

          {/* Icône enveloppe */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Vérifiez votre email
          </h1>
          <p className="text-slate-500 text-sm mb-4">
            Un email de confirmation vous a été envoyé.
            Cliquez sur le lien dans cet email pour activer votre compte.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            Vous ne trouvez pas l'email ? Vérifiez vos spams ou courrier indésirable.
          </p>

          {/* Bouton de renvoi */}
          {renvoyé ? (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              Email de confirmation renvoyé. Vérifiez votre boîte mail.
            </p>
          ) : (
            <button
              type="button"
              onClick={renvoyer}
              disabled={envoiEnCours}
              className="text-sm text-blue-600 hover:text-blue-800 underline mb-4 block w-full"
            >
              {envoiEnCours ? 'Envoi...' : "Renvoyer l'email de confirmation"}
            </button>
          )}

          {erreur && (
            <p className="text-sm text-red-600 mb-4">{erreur}</p>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Retour à la connexion</Link>
          </Button>

        </div>
      </div>
    </div>
  )
}
