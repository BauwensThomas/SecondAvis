'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

// Contenu separé pour pouvoir utiliser useSearchParams dans Suspense
function ConfirmContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [renvoyé, setRenvoyé]           = useState(false)
  const [erreur, setErreur]             = useState('')
  const [confirmation, setConfirmation] = useState(false)

  // Verifie si un token est present dans l URL et confirme le compte automatiquement
  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type       = searchParams.get('type')

    if (token_hash && type) {
      const supabase = createClient()
      supabase.auth.verifyOtp({
        type: type as 'email' | 'recovery' | 'email_change',
        token_hash,
      }).then(({ error }) => {
        if (error) {
          setErreur('Le lien de confirmation est invalide ou a expiré.')
        } else {
          setConfirmation(true)
          setTimeout(() => router.push('/'), 2000)
        }
      })
    }
  }, [searchParams, router])

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
      setErreur('Erreur inattendue. Réessayez.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  // Compte confirme avec succes
  if (confirmation) {
    return (
      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Email confirme</h1>
        <p className="text-slate-500 text-sm">Votre compte est actif. Redirection en cours...</p>
      </div>
    )
  }

  return (
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

      {/* Bouton de renvoi */}
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
  )
}

// Page de confirmation email
export default function ConfirmPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-2xl font-bold text-slate-900">
          SecondAvis
        </Link>
        <Suspense fallback={<div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 shadow-sm h-48" />}>
          <ConfirmContent />
        </Suspense>
      </div>
    </div>
  )
}
