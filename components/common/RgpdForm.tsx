'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const TYPES = [
  { value: 'access',        label: 'Accès à mes données' },
  { value: 'rectification', label: 'Rectification de mes données' },
  { value: 'erasure',       label: 'Effacement (droit à l\'oubli)' },
  { value: 'portability',   label: 'Portabilité de mes données' },
  { value: 'opposition',    label: 'Opposition au traitement marketing' },
  { value: 'autre',         label: 'Autre question' },
]

// Formulaire RGPD - nécessite d'être connecté pour garantir l'identité du demandeur
export default function RgpdForm() {
  const [session, setSession]   = useState<{ email: string; first_name?: string } | null>(null)
  const [chargement, setCharge] = useState(true)
  const [typeDemande, setType]  = useState('')
  const [message, setMessage]   = useState('')
  const [envoi, setEnvoi]       = useState(false)
  const [succes, setSucces]     = useState(false)
  const [erreur, setErreur]     = useState('')

  // Vérifie si l'utilisateur est connecté
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.email) {
          setSession({ email: data.user.email, first_name: data.user.first_name })
        }
      })
      .catch(() => {})
      .finally(() => setCharge(false))
  }, [])

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!session) return
    setEnvoi(true)
    setErreur('')

    const res = await fetch('/api/rgpd/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:        session.email,
        nom:          session.first_name ?? session.email,
        type_demande: typeDemande,
        message,
      }),
    })

    if (res.ok) {
      setSucces(true)
    } else {
      const data = await res.json()
      setErreur(data.error ?? 'Une erreur est survenue.')
    }
    setEnvoi(false)
  }

  // Chargement
  if (chargement) {
    return <div className="h-24 bg-slate-100 rounded-xl animate-pulse mt-4" />
  }

  // Non connecté
  if (!session) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-4 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-slate-600">
          Connectez-vous pour exercer vos droits. Cela nous permet de vérifier votre identité et d'utiliser votre adresse email officielle.
        </p>
        <Link href="/login?redirect=/politique-confidentialite"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shrink-0">
          Se connecter
        </Link>
      </div>
    )
  }

  // Succès
  if (succes) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-sm text-green-800 mt-4">
        Votre demande a bien été reçue pour le compte <strong>{session.email}</strong>. Nous vous répondrons dans les meilleurs délais.
      </div>
    )
  }

  // Formulaire connecté
  return (
    <form onSubmit={soumettre} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 mt-4">
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">Demande soumise au nom de</p>
          <p className="text-sm font-medium text-slate-800">{session.email}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Connecté</span>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Type de demande</label>
        <select required value={typeDemande} onChange={(e) => setType(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">Sélectionnez un type</option>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Message (facultatif)</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          rows={3} placeholder="Précisez votre demande si nécessaire..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button type="submit" disabled={envoi}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
        {envoi ? 'Envoi...' : 'Envoyer ma demande'}
      </button>
    </form>
  )
}
