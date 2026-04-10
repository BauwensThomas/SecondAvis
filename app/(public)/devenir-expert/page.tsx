'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'mecanique',    label: 'Mécanique automobile' },
  { value: 'immo',         label: 'Immobilier' },
  { value: 'travaux',      label: 'Travaux et artisanat' },
  { value: 'assurance',    label: 'Assurances' },
  { value: 'travail',      label: 'Droit du travail' },
  { value: 'comptabilite', label: 'Comptabilité indépendants' },
]

const ETAPES = ['Votre profil', 'Votre expertise', 'Justificatif']

// Page de candidature expert - nécessite d'être connecté
export default function DevenirExpertPage() {
  const router  = useRouter()
  const [session, setSession]     = useState<any>(null)
  const [chargement, setChargement] = useState(true)

  const [etape, setEtape]   = useState(0)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi]   = useState(false)

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '',
    display_name: '', bio: '', city: '',
    languages: ['fr'] as string[],
    categories: [] as string[],
    years_experience: '',
    entity_type: 'individual' as 'individual' | 'company',
    company_name: '', bce_number: '', vat_number: '',
    motivation: '',
  })

  const [documentUrl, setDocumentUrl]     = useState('')
  const [uploadNom, setUploadNom]         = useState('')
  const [uploadEnCours, setUploadEnCours] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Vérifie si l'utilisateur est connecté, pré-remplit les champs depuis son profil
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.user) {
          router.push('/login?redirect=/devenir-expert')
          return
        }
        if (data.role === 'expert') {
          router.push('/expert/dashboard')
          return
        }
        setSession(data)
        setForm((prev) => ({
          ...prev,
          first_name: data.user.first_name ?? '',
          last_name:  data.user.last_name  ?? '',
          phone:      data.user.phone      ?? '',
        }))
        setChargement(false)
      })
      .catch(() => router.push('/login?redirect=/devenir-expert'))
  }, [router])

  function setChamp(champ: string, valeur: string) {
    setForm((prev) => ({ ...prev, [champ]: valeur }))
  }

  function toggleCategorie(val: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(val)
        ? prev.categories.filter((c) => c !== val)
        : [...prev.categories, val],
    }))
  }

  function toggleLangue(val: string) {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.includes(val)
        ? prev.languages.filter((l) => l !== val)
        : [...prev.languages, val],
    }))
  }

  async function uploadFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadEnCours(true)
    setErreur('')
    const fd = new FormData()
    fd.append('file', file)
    const res  = await fetch('/api/candidatures/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { setErreur(json.error); setUploadEnCours(false); return }
    setDocumentUrl(json.url)
    setUploadNom(file.name)
    setUploadEnCours(false)
  }

  function validerEtape() {
    setErreur('')
    if (etape === 0) {
      if (!form.first_name || !form.last_name || !form.phone || !form.display_name || !form.city) {
        setErreur('Veuillez remplir tous les champs obligatoires.')
        return
      }
    }
    if (etape === 1) {
      if (!form.categories.length || !form.years_experience) {
        setErreur('Choisissez au moins une catégorie et indiquez vos années d\'expérience.')
        return
      }
      if (form.entity_type === 'company' && !form.company_name) {
        setErreur('Indiquez le nom de votre société.')
        return
      }
    }
    setEtape((prev) => prev + 1)
  }

  async function soumettre() {
    if (!documentUrl) { setErreur('Veuillez uploader un justificatif.'); return }
    setEnvoi(true)
    setErreur('')
    const res = await fetch('/api/candidatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        email:        session.user.email,
        document_url: documentUrl,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setErreur(json.error); setEnvoi(false); return }
    setEnvoye(true)
    setEnvoi(false)
  }

  if (chargement) return (
    <main className="page-container max-w-2xl mx-auto">
      <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
    </main>
  )

  if (envoye) {
    return (
      <main className="page-container max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center space-y-4">
          <div className="text-5xl">✓</div>
          <h1 className="text-2xl font-bold text-green-800">Candidature envoyée !</h1>
          <p className="text-green-700">
            Nous avons bien reçu votre dossier. Notre équipe l'examine et reviendra vers vous à <strong>{session.user.email}</strong>.
          </p>
          <p className="text-sm text-green-600">Vérifiez vos spams si vous ne recevez rien.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="page-container max-w-2xl mx-auto">

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Devenir expert SecondAvis</h1>
      <p className="text-slate-500 text-sm mb-8">
        Partagez votre expertise, aidez des particuliers, développez votre visibilité.
      </p>

      {/* Connecté en tant que */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 text-sm text-indigo-800 mb-6 flex items-center justify-between">
        <span>Connecté en tant que <strong>{session?.user?.email}</strong></span>
        <Link href="/mon-compte" className="text-indigo-600 hover:underline text-xs">Mon compte</Link>
      </div>

      {/* Barre de progression */}
      <div className="flex items-center gap-2 mb-8">
        {ETAPES.map((nom, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
              i < etape ? 'bg-indigo-600 text-white' :
              i === etape ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
              'bg-slate-200 text-slate-500'
            }`}>{i < etape ? '✓' : i + 1}</div>
            <span className={`text-xs font-medium hidden sm:block ${i === etape ? 'text-indigo-700' : 'text-slate-400'}`}>{nom}</span>
            {i < ETAPES.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < etape ? 'bg-indigo-400' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">

        {/* ETAPE 1 - Profil */}
        {etape === 0 && (
          <>
            <h2 className="font-semibold text-slate-900 text-lg">Vos informations personnelles</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Prénom *</label>
                <input type="text" value={form.first_name} onChange={(e) => setChamp('first_name', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nom *</label>
                <input type="text" value={form.last_name} onChange={(e) => setChamp('last_name', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
                <input type="email" value={session?.user?.email ?? ''} disabled
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
                <p className="text-xs text-slate-400 mt-0.5">L'email de votre compte SecondAvis</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Téléphone *</label>
                <input type="tel" value={form.phone} onChange={(e) => setChamp('phone', e.target.value)}
                  placeholder="04XX XX XX XX"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Pseudo affiché *</label>
                <input type="text" value={form.display_name} onChange={(e) => setChamp('display_name', e.target.value)}
                  placeholder="Ex : Marc C. - visible par les clients"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Ville *</label>
                <input type="text" value={form.city} onChange={(e) => setChamp('city', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Présentation (visible sur votre profil)</label>
              <textarea value={form.bio} onChange={(e) => setChamp('bio', e.target.value)}
                rows={3} maxLength={500} placeholder="Décrivez votre parcours et votre expertise en quelques phrases..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" />
              <p className="text-xs text-slate-400 text-right">{form.bio.length}/500</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-2">Langues de réponse</label>
              <div className="flex gap-3">
                {[['fr', 'Français'], ['nl', 'Néerlandais'], ['en', 'Anglais']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700">
                    <input type="checkbox" checked={form.languages.includes(val)}
                      onChange={() => toggleLangue(val)} className="rounded" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ETAPE 2 - Expertise */}
        {etape === 1 && (
          <>
            <h2 className="font-semibold text-slate-900 text-lg">Votre expertise</h2>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-2">Catégories *</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <label key={cat.value}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm transition-colors ${
                      form.categories.includes(cat.value)
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}>
                    <input type="checkbox" className="hidden"
                      checked={form.categories.includes(cat.value)}
                      onChange={() => toggleCategorie(cat.value)} />
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      form.categories.includes(cat.value) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                    }`}>
                      {form.categories.includes(cat.value) && <span className="text-white text-xs">✓</span>}
                    </span>
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Années d'expérience *</label>
              <input type="number" min="1" max="60" value={form.years_experience}
                onChange={(e) => setChamp('years_experience', e.target.value)}
                className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-2">Type de compte *</label>
              <div className="flex gap-3">
                {[['individual', 'Particulier'], ['company', 'Société']].map(([val, label]) => (
                  <label key={val} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm ${
                    form.entity_type === val ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-200 text-slate-700'
                  }`}>
                    <input type="radio" name="entity_type" value={val}
                      checked={form.entity_type === val as any}
                      onChange={() => setChamp('entity_type', val)}
                      className="hidden" />
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      form.entity_type === val ? 'border-indigo-600' : 'border-slate-300'
                    }`}>
                      {form.entity_type === val && <span className="w-2 h-2 rounded-full bg-indigo-600 block" />}
                    </span>
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {form.entity_type === 'company' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Nom de la société *</label>
                  <input type="text" value={form.company_name} onChange={(e) => setChamp('company_name', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Numéro BCE</label>
                  <input type="text" value={form.bce_number} onChange={(e) => setChamp('bce_number', e.target.value)}
                    placeholder="BE0123456789" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Numéro TVA</label>
                  <input type="text" value={form.vat_number} onChange={(e) => setChamp('vat_number', e.target.value)}
                    placeholder="BE0123456789" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Pourquoi voulez-vous rejoindre SecondAvis ?</label>
              <textarea value={form.motivation} onChange={(e) => setChamp('motivation', e.target.value)}
                rows={3} placeholder="Décrivez votre motivation..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
          </>
        )}

        {/* ETAPE 3 - Justificatif */}
        {etape === 2 && (
          <>
            <h2 className="font-semibold text-slate-900 text-lg">Justificatif professionnel</h2>
            <p className="text-sm text-slate-600">
              Uploadez un document prouvant votre expertise : diplôme, certificat, numéro BCE, carte professionnelle ou extrait de registre de commerce.
            </p>

            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                documentUrl ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50'
              }`}>
              {documentUrl ? (
                <div className="space-y-1">
                  <p className="text-green-700 font-medium text-sm">✓ {uploadNom}</p>
                  <p className="text-xs text-green-600">Cliquez pour remplacer</p>
                </div>
              ) : uploadEnCours ? (
                <p className="text-slate-500 text-sm">Envoi en cours...</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-slate-600 text-sm font-medium">Cliquez pour choisir un fichier</p>
                  <p className="text-xs text-slate-400">PDF, JPG ou PNG - max 10 MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={uploadFichier} className="hidden" />

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">Documents acceptés</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-700">
                <li>Diplôme ou certificat professionnel</li>
                <li>Numéro BCE belge vérifiable</li>
                <li>Carte professionnelle (ordre des architectes, barreau, etc.)</li>
                <li>Extrait de registre de commerce</li>
              </ul>
            </div>
          </>
        )}

        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

        <div className="flex items-center justify-between pt-2">
          {etape > 0 ? (
            <button onClick={() => setEtape((prev) => prev - 1)}
              className="text-sm text-slate-500 hover:text-slate-700">← Retour</button>
          ) : <div />}

          {etape < ETAPES.length - 1 ? (
            <Button onClick={validerEtape}>Continuer →</Button>
          ) : (
            <Button onClick={soumettre} disabled={envoi || !documentUrl}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
              {envoi ? 'Envoi...' : 'Soumettre ma candidature'}
            </Button>
          )}
        </div>

      </div>
    </main>
  )
}
