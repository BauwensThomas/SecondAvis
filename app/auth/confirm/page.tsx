'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

// Page de confirmation email
// Gere deux cas : attente de confirmation ET retour apres clic sur le lien email
export default function ConfirmPage() {
  const router = useRouter()
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [renvoyé, setRenvoyé]           = useState(false)
  const [erreur, setErreur]             = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const [chargement, setChargement]     = useState(true)

  // Au chargement, verifie si la session est deja active (retour apres clic lien email)
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Session active = email confirme, redirection vers l accueil
        setConfirmation(true)
        setTimeout(() => router.push('/'), 1500)
      } else {
        setChargement(false)
      }
    })
  }, [router])

  // Demande a Supabase de renvoyer l email de confirmation
  async function renvoyer() {
    setEnvoiEnCours(true)
    setErreur('')
    try {
      const res  = await fetch('/api/auth/resend-confirmation', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setErreur(data.error ?? 'Erreur lors du renvoi.')
      else setRenvoyé(true)
    } catch {
      setErreur('Erreur inattendue. Reessayez.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  // Pendant la verification de session
  if (chargement) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Email confirme avec succes
  if (confirmation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <Link href="/" className="text-2xl font-bold text-slate-900">SecondAvis</Link>
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Email confirme</h1>
            <p className="text-slate-500 text-sm">Votre compte est actif. Redirection en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <Link href="/" className="text-2xl font-bold text-slate-900">SecondAvis</Link>

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">

          {/* Icone enveloppe */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-slate-800 mb-2">
            Verifiez votre email
          </h1>
          <p className="text-slate-500 text-sm mb-4">
            Un email de confirmation vous a ete envoye.
            Cliquez sur le lien dans cet email pour activer votre compte.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            Vous ne trouvez pas l email ? Verifiez vos spams ou courrier indesirable.
          </p>

          {renvoyé ? (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              Email de confirmation renvoye. Verifiez votre boite mail.
            </p>
          ) : (
            <button
              type="button"
              onClick={renvoyer}
              disabled={envoiEnCours}
              className="text-sm text-blue-600 hover:text-blue-800 underline mb-4 block w-full"
            >
              {envoiEnCours ? 'Envoi...' : "Renvoyer l email de confirmation"}
            </button>
          )}

          {erreur && (
            <p className="text-sm text-red-600 mb-4">{erreur}</p>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Retour a la connexion</Link>
          </Button>

        </div>
      </div>
    </div>
  )
}
