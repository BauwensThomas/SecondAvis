'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ExpertGuard, { useExpertContext } from '@/components/layout/ExpertGuard'

// ---- Schémas de validation ----

const profilSchema = z.object({
  display_name:     z.string().min(1, 'Le pseudo est obligatoire'),
  bio:              z.string().min(1, 'La bio est obligatoire').max(500, 'Max 500 caractères'),
  years_experience: z.number().int().min(0, 'Valeur invalide'),
  city:             z.string().min(1, 'La ville est obligatoire'),
  website_url:      z.string().optional(),
  availabilities:   z.string().optional(),
  languages:        z.array(z.enum(['fr', 'nl', 'en'])).min(1, 'Choisissez au moins une langue'),
  categories:       z.array(z.string()).min(1, 'Choisissez au moins une catégorie'),
  phone:            z.string().min(1, 'Le téléphone est obligatoire'),
  phone_public:     z.boolean(),
  address_street:   z.string().min(1, 'La rue est obligatoire'),
  address_zip:      z.string().min(1, 'Le code postal est obligatoire'),
  address_city:     z.string().min(1, 'La ville est obligatoire'),
  address_public:   z.boolean(),
  entity_type:      z.enum(['individual', 'company']),
  company_name:     z.string().optional(),
  bce_number:       z.string().optional(),
  vat_number:       z.string().optional(),
})

type ProfilData = z.infer<typeof profilSchema>

const CATEGORIES_OPTIONS = [
  { value: 'mecanique',    label: 'Mécanique automobile' },
  { value: 'immo',         label: 'Immobilier' },
  { value: 'travaux',      label: 'Travaux' },
  { value: 'assurance',    label: 'Assurance' },
  { value: 'travail',      label: 'Droit du travail' },
  { value: 'comptabilite', label: 'Comptabilité' },
]

const LANGUES_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'nl', label: 'Néerlandais' },
  { value: 'en', label: 'Anglais' },
]

// Page profil expert - modification du profil public, des catégories, de l'adresse et des infos pro
// Le prénom, nom, téléphone et mot de passe sont gérés dans /mon-compte
function ExpertProfilPage() {
  const { role, hasExpertAccount } = useExpertContext()
  const [loading, setLoading]         = useState(true)
  const [success, setSuccess]         = useState('')
  const [erreur, setErreur]           = useState('')
  const [photoUrl, setPhotoUrl]       = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoErreur, setPhotoErreur] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfilData>({ resolver: zodResolver(profilSchema) })
  const entityType = form.watch('entity_type')

  // Charge le profil expert au montage
  useEffect(() => {
    if (role === 'admin' && !hasExpertAccount) { setLoading(false); return }
    fetch('/api/expert/profile-data')
      .then((r) => r.json())
      .then((data) => {
        if (data.expert) {
          const e = data.expert
          form.reset({
            display_name:     e.display_name ?? '',
            bio:              e.bio ?? '',
            years_experience: e.years_experience ?? 0,
            city:             e.city ?? '',
            website_url:      e.website_url ?? '',
            availabilities:   e.availabilities ?? '',
            languages:        e.languages ?? ['fr'],
            categories:       e.categories ?? [],
            phone:            e.phone ?? '',
            phone_public:     e.phone_public ?? false,
            address_street:   e.address_street ?? '',
            address_zip:      e.address_zip ?? '',
            address_city:     e.address_city ?? '',
            address_public:   e.address_public ?? false,
            entity_type:      e.entity_type ?? 'individual',
            company_name:     e.company_name ?? '',
            bce_number:       e.bce_number ?? '',
            vat_number:       e.vat_number ?? '',
          })
          setPhotoUrl(e.photo_url ?? null)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [form])

  // Upload de la photo de profil dès sélection du fichier
  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoErreur('')
    setPhotoLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/expert/photo', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok) setPhotoErreur(json.error || "Erreur lors de l'upload.")
    else setPhotoUrl(json.photo_url)

    setPhotoLoading(false)
    e.target.value = ''
  }

  // Sauvegarde le profil complet
  async function onSubmit(data: ProfilData) {
    setSuccess('')
    setErreur('')

    const res = await fetch('/api/expert/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    if (!res.ok) setErreur(json.error || 'Erreur lors de la sauvegarde.')
    else setSuccess('Profil mis à jour.')
  }

  // Message pour l'admin sans compte expert
  if (role === 'admin' && !hasExpertAccount) {
    return (
      <main className="page-container">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-indigo-900 mb-1">Espace expert</p>
          <p className="text-indigo-700 text-sm">Votre compte administrateur n'a pas de profil expert associé.</p>
          <p className="text-indigo-600 text-sm mt-1">Gérez les experts depuis <a href="/admin/experts" className="underline font-medium">l'espace admin</a>.</p>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="page-container space-y-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />)}
      </main>
    )
  }

  const categoriesSelectionnees = form.watch('categories') ?? []
  const languesSelectionnees    = form.watch('languages') ?? []

  return (
    <main className="page-container space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mon profil expert</h1>
        <Link href="/mon-compte" className="text-sm text-indigo-700 dark:text-indigo-400 hover:underline">
          Prénom, nom, téléphone et mot de passe →
        </Link>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ---- Profil public ---- */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Profil public</h2>
          <p className="text-xs text-slate-400">Ces informations sont visibles par tous les clients.</p>

          {/* Photo de profil */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
              {photoUrl
                ? <Image src={photoUrl} alt="Photo de profil" width={64} height={64} className="object-cover w-full h-full" />
                : <span className="text-2xl text-slate-300">?</span>
              }
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhotoChange} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={photoLoading}>
                {photoLoading ? 'Upload...' : 'Changer la photo'}
              </Button>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG ou WebP - max 2 Mo (optionnel)</p>
              {photoErreur && <p className="text-red-500 text-xs mt-1">{photoErreur}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Pseudo affiché</label>
            <input {...form.register('display_name')} placeholder="Ex : Marc C."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {form.formState.errors.display_name && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.display_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bio <span className="text-slate-400">(max 500 caractères)</span>
            </label>
            <textarea {...form.register('bio')} rows={4}
              placeholder="Ex : Mécanicien depuis 18 ans, spécialisé véhicules diesel et diagnostic électronique."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            {form.formState.errors.bio && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.bio.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Années d'expérience</label>
              <input {...form.register('years_experience', { valueAsNumber: true })} type="number" min={0} placeholder="Ex : 18"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {form.formState.errors.years_experience && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.years_experience.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville affichée</label>
              <input {...form.register('city')} placeholder="Ex : Liège"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {form.formState.errors.city && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Disponibilités <span className="text-slate-400">(optionnel)</span>
              </label>
              <input {...form.register('availabilities')} placeholder="Ex : Lun-Ven 18h-22h"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Site web ou LinkedIn <span className="text-slate-400">(optionnel)</span>
              </label>
              <input {...form.register('website_url')} placeholder="https://..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* Téléphone avec visibilité */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Téléphone</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...form.register('phone_public')} className="w-4 h-4 text-indigo-600 rounded" />
                <span className="text-xs text-slate-500">Visible sur mon profil public</span>
              </label>
            </div>
            <input {...form.register('phone')} type="tel" placeholder="+32 470 00 00 00"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {form.formState.errors.phone && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
            )}
          </div>

          {/* Langues de réponse */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Langues de réponse</label>
            <div className="flex gap-6">
              {LANGUES_OPTIONS.map((l) => (
                <label key={l.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={languesSelectionnees.includes(l.value as 'fr' | 'nl' | 'en')}
                    onChange={(e) => {
                      const current = languesSelectionnees as string[]
                      form.setValue('languages', (e.target.checked
                        ? [...current, l.value]
                        : current.filter((v) => v !== l.value)
                      ) as ('fr' | 'nl' | 'en')[])
                    }}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-slate-700">{l.label}</span>
                </label>
              ))}
            </div>
            {form.formState.errors.languages && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.languages.message}</p>
            )}
          </div>
        </section>

        {/* ---- Catégories et notifications ---- */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Catégories et notifications</h2>
            <p className="text-xs text-slate-400 mt-1">
              Vous recevrez un email dès qu'une nouvelle demande arrive dans les catégories sélectionnées.
            </p>
          </div>
          <div className="space-y-2">
            {CATEGORIES_OPTIONS.map((cat) => (
              <label key={cat.value} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                categoriesSelectionnees.includes(cat.value)
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={categoriesSelectionnees.includes(cat.value)}
                  onChange={(e) => {
                    const current = categoriesSelectionnees
                    form.setValue('categories', e.target.checked
                      ? [...current, cat.value]
                      : current.filter((v) => v !== cat.value)
                    )
                  }}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-slate-800">{cat.label}</span>
              </label>
            ))}
          </div>
          {form.formState.errors.categories && (
            <p className="text-red-500 text-xs">{form.formState.errors.categories.message}</p>
          )}
        </section>

        {/* ---- Adresse ---- */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Adresse</h2>
              <p className="text-xs text-slate-400 mt-0.5">Nécessaire pour les documents comptables.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...form.register('address_public')} className="w-4 h-4 text-indigo-600 rounded" />
              <span className="text-xs text-slate-500">Visible sur mon profil public</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rue et numéro</label>
            <input {...form.register('address_street')} placeholder="Ex : Rue de la Loi 12"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {form.formState.errors.address_street && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.address_street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code postal</label>
              <input {...form.register('address_zip')} placeholder="Ex : 4000"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {form.formState.errors.address_zip && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.address_zip.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
              <input {...form.register('address_city')} placeholder="Ex : Liège"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {form.formState.errors.address_city && (
                <p className="text-red-500 text-xs mt-1">{form.formState.errors.address_city.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* ---- Informations professionnelles ---- */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Informations professionnelles</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type de compte</label>
            <div className="flex gap-4">
              {[
                { value: 'individual', label: 'Particulier' },
                { value: 'company',    label: 'Société / Indépendant' },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer flex-1 transition-colors ${
                  entityType === opt.value ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-400'
                }`}>
                  <input type="radio" value={opt.value} {...form.register('entity_type')} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {entityType === 'company' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nom de la société <span className="text-slate-400">(optionnel)</span>
              </label>
              <input {...form.register('company_name')} placeholder="Ex : Garage Dupont SPRL"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Numéro BCE <span className="text-slate-400">(optionnel)</span>
              </label>
              <input {...form.register('bce_number')} placeholder="Ex : BE0123456789"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Numéro TVA <span className="text-slate-400">(optionnel)</span>
              </label>
              <input {...form.register('vat_number')} placeholder="Ex : BE0123456789"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </section>

        {success && (
          <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3">{success}</p>
        )}
        {erreur && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{erreur}</p>
        )}

        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
          Sauvegarder mon profil
        </Button>
      </form>

      {/* Lien vers la charte */}
      <div className="border-t border-slate-100 pt-6 mt-6">
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Vous souhaitez relire la charte de bonne conduite que vous avez signée ?{' '}
          <a href="/expert/charte" className="text-indigo-700 dark:text-indigo-400 hover:underline">
            Consulter la charte
          </a>
        </p>
      </div>

      {/* Section suppression de compte */}
      <SupprimerCompteExpertSection />

    </main>
  )
}

// Section suppression de compte expert avec confirmation en 2 étapes
function SupprimerCompteExpertSection() {
  const [etape, setEtape]   = useState<'idle' | 'confirmer'>('idle')
  const [envoi, setEnvoi]   = useState(false)
  const [erreur, setErreur] = useState('')

  async function supprimerCompte() {
    setEnvoi(true)
    setErreur('')

    const res  = await fetch('/api/expert/delete-account', { method: 'POST' })
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
        Cette action est <span className="font-semibold text-red-700">irréversible</span>. Toutes vos données d'expert seront anonymisées.<br />
        Vos réponses et transactions sont conservées sous forme anonyme (obligation légale).<br />
        <span className="block mt-2 text-slate-700 font-medium">
          • <span className="font-semibold">La suppression du compte expert n'efface pas votre compte client</span> : vous pourrez toujours poser des questions en tant que client.<br />
          • <span className="font-semibold">Tous vos gains en attente non encore virés seront définitivement annulés</span> au moment de la suppression.<br />
          • <span className="font-semibold">Aucun gain non viré ne sera remboursé</span> après suppression, conformément à la charte.<br />
        </span>
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
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-red-800">
            Êtes-vous certain de vouloir supprimer votre compte expert ?
          </p>
          <p className="text-xs text-red-600">
            Cette action est définitive. Votre profil public sera retiré et vous ne pourrez plus répondre aux demandes.
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

export default function ExpertProfilPageGuarded() {
  return <ExpertGuard><ExpertProfilPage /></ExpertGuard>
}
