'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'

// ---- Schémas de validation ----

const profilSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est obligatoire'),
  last_name: z.string().min(1, 'Le nom est obligatoire'),
  phone: z.string().optional(),
  marketing_emails: z.boolean(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Le mot de passe actuel est obligatoire'),
  new_password: z.string().min(8, 'Le nouveau mot de passe doit faire au moins 8 caractères'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

type ProfilData = z.infer<typeof profilSchema>
type PasswordData = z.infer<typeof passwordSchema>

// Page profil du client - modification des informations personnelles et du mot de passe
export default function MonComptePage() {
  const [loading, setLoading] = useState(true)
  const [successProfil, setSuccessProfil] = useState('')
  const [erreurProfil, setErreurProfil] = useState('')
  const [successPassword, setSuccessPassword] = useState('')
  const [erreurPassword, setErreurPassword] = useState('')

  const profilForm = useForm<ProfilData>({ resolver: zodResolver(profilSchema) })
  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  // Charge les informations de l'utilisateur connecté
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          profilForm.reset({
            first_name: data.user.first_name ?? '',
            last_name: data.user.last_name ?? '',
            phone: data.user.phone ?? '',
            marketing_emails: data.user.marketing_emails ?? false,
          })
        }
        setLoading(false)
      })
  }, [profilForm])

  // Sauvegarde les informations du profil
  async function onSaveProfil(data: ProfilData) {
    setSuccessProfil('')
    setErreurProfil('')

    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    if (!res.ok) setErreurProfil(json.error || 'Erreur lors de la sauvegarde.')
    else setSuccessProfil('Informations mises à jour.')
  }

  // Change le mot de passe
  async function onChangePassword(data: PasswordData) {
    setSuccessPassword('')
    setErreurPassword('')

    const res = await fetch('/api/user/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: data.current_password,
        new_password: data.new_password,
      }),
    })

    const json = await res.json()
    if (!res.ok) setErreurPassword(json.error || 'Erreur lors du changement.')
    else {
      setSuccessPassword('Mot de passe modifié avec succès.')
      passwordForm.reset()
    }
  }

  if (loading) {
    return (
      <main className="page-container space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </main>
    )
  }

  return (
    <main className="page-container space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Mon compte</h1>

      {/* ---- Section informations ---- */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-5">Mes informations</h2>

        <form onSubmit={profilForm.handleSubmit(onSaveProfil)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
              <input
                {...profilForm.register('first_name')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {profilForm.formState.errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{profilForm.formState.errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input
                {...profilForm.register('last_name')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {profilForm.formState.errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{profilForm.formState.errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Téléphone <span className="text-slate-400">(optionnel)</span>
            </label>
            <input
              {...profilForm.register('phone')}
              type="tel"
              placeholder="+32 470 00 00 00"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...profilForm.register('marketing_emails')}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-slate-700">Recevoir les emails marketing</span>
          </label>

          {successProfil && (
            <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
              {successProfil}
            </p>
          )}
          {erreurProfil && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {erreurProfil}
            </p>
          )}

          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            Sauvegarder
          </Button>
        </form>
      </section>

      {/* ---- Section sécurité ---- */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-5">Sécurité</h2>

        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mot de passe actuel
            </label>
            <input
              {...passwordForm.register('current_password')}
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordForm.formState.errors.current_password && (
              <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.current_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              {...passwordForm.register('new_password')}
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordForm.formState.errors.new_password && (
              <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              {...passwordForm.register('confirm_password')}
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {passwordForm.formState.errors.confirm_password && (
              <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirm_password.message}</p>
            )}
          </div>

          {successPassword && (
            <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
              {successPassword}
            </p>
          )}
          {erreurPassword && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {erreurPassword}
            </p>
          )}

          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            Changer mon mot de passe
          </Button>
        </form>
      </section>

      {/* Section suppression de compte */}
      <SupprimerCompteSection />
    </main>
  )
}

// Section suppression de compte avec confirmation en 2 étapes
function SupprimerCompteSection() {
  const [etape, setEtape]       = useState<'idle' | 'confirmer'>('idle')
  const [envoi, setEnvoi]       = useState(false)
  const [erreur, setErreur]     = useState('')

  async function supprimerCompte() {
    setEnvoi(true)
    setErreur('')

    const res = await fetch('/api/user/delete-account', { method: 'POST' })
    const json = await res.json()

    if (!res.ok) {
      setErreur(json.error || 'Erreur lors de la suppression.')
      setEnvoi(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <section className="border-2 border-red-400 rounded-xl p-6 mt-8">
      <h2 className="text-lg font-semibold text-red-700 mb-1">Supprimer mon compte</h2>
      <p className="text-sm text-slate-600 mb-4">
        Cette action est irréversible. Vos données personnelles seront anonymisées.
        Vos demandes et transactions sont conservées sous forme anonyme (obligation légale).
      </p>

      {etape === 'idle' && (
        <button
          onClick={() => setEtape('confirmer')}
          className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Supprimer mon compte
        </button>
      )}

      {etape === 'confirmer' && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-red-800">
            Êtes-vous certain de vouloir supprimer votre compte ?
          </p>
          <p className="text-xs text-red-600">
            Cette action est définitive. Vous perdrez l'accès à votre historique de demandes.
          </p>
          {erreur && <p className="text-red-600 text-xs">{erreur}</p>}
          <div className="flex gap-3">
            <button
              onClick={supprimerCompte}
              disabled={envoi}
              className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {envoi ? 'Suppression...' : 'Oui, supprimer définitivement'}
            </button>
            <button
              onClick={() => setEtape('idle')}
              className="text-sm text-slate-600 hover:text-slate-800 px-4 py-2"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
