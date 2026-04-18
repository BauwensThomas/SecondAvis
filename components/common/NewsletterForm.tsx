'use client'

import { useState, useEffect } from 'react'

const CLE_LOCALSTORAGE = 'newsletter_inscrit'

// Formulaire d'inscription à la newsletter blog - capte les visiteurs anonymes
export default function NewsletterForm() {
  const [email, setEmail]       = useState('')
  const [statut, setStatut]     = useState<'idle' | 'chargement' | 'succes' | 'erreur'>('idle')
  const [message, setMessage]   = useState('')
  const [dejaInscrit, setDejaInscrit] = useState(false)

  // Vérifie au chargement si l'utilisateur s'est déjà inscrit sur cet appareil
  useEffect(() => {
    if (localStorage.getItem(CLE_LOCALSTORAGE) === '1') {
      setDejaInscrit(true)
    }
  }, [])

  // Envoie l'email à la route API et mémorise l'inscription dans localStorage
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return

    setStatut('chargement')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        localStorage.setItem(CLE_LOCALSTORAGE, '1')
        setStatut('succes')
        setDejaInscrit(true)
        setEmail('')
      } else {
        const data = await res.json()
        setStatut('erreur')
        setMessage(data.error ?? 'Une erreur est survenue.')
      }
    } catch {
      setStatut('erreur')
      setMessage('Impossible de se connecter au serveur.')
    }
  }

  // L'utilisateur est déjà inscrit : on n'affiche rien
  if (dejaInscrit && statut !== 'succes') return null

  return (
    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-xl p-6 text-center">
      <p className="text-slate-800 dark:text-white font-semibold text-lg mb-1">
        Recevez nos prochains guides
      </p>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
        Conseils pratiques pour éviter les arnaques, directement dans votre boite mail. Pas de spam.
      </p>

      {statut === 'succes' ? (
        <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
          Inscription confirmée. Merci !
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            disabled={statut === 'chargement'}
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={statut === 'chargement'}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 shrink-0"
          >
            {statut === 'chargement' ? 'Envoi...' : "S'inscrire"}
          </button>
        </form>
      )}

      {statut === 'erreur' && (
        <p className="text-red-500 text-xs mt-2">{message}</p>
      )}
    </div>
  )
}
