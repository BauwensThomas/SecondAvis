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

const BENEFICES = [
  {
    titre: 'Rémunéré pour chaque réponse',
    texte: 'Chaque réponse validée est payée automatiquement sur votre compte bancaire, sans délai ni démarche de votre part.',
    icone: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    titre: 'Visibilité sur votre profil',
    texte: 'Chaque réponse débloque votre profil public. Les clients satisfaits peuvent vous contacter directement pour aller plus loin. Une opportunité concrète à chaque réponse.',
    icone: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    titre: 'Aucun engagement, zéro abonnement',
    texte: 'Vous répondez uniquement aux demandes qui vous intéressent, quand vous avez du temps. Pas de quota, pas de minimum.',
    icone: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    titre: 'Protection complète',
    texte: 'En cas de signalement injustifié, notre équipe analyse le dossier et vous protège. Votre réputation est entre de bonnes mains.',
    icone: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
]

const COMMENT_CA_MARCHE = [
  { num: 1, titre: 'Soumettez votre candidature', texte: 'Remplissez le formulaire et uploadez un justificatif de votre expertise (diplôme, BCE, carte pro...).' },
  { num: 2, titre: 'Validation rapide', texte: 'Notre équipe examine votre dossier et vous répond par email. En cas de validation, vous recevez vos accès immédiatement.' },
  { num: 3, titre: 'Répondez et soyez rémunéré', texte: 'Parcourez les demandes dans vos catégories et répondez à celles qui vous conviennent. Paiement automatique.' },
]

// Page de candidature expert - section marketing + formulaire multi-étapes
export default function DevenirExpertPage() {
  const router  = useRouter()
  const [session, setSession]         = useState<{ user: { email: string; first_name?: string; last_name?: string; phone?: string }, role: string } | null>(null)
  const [chargement, setChargement]   = useState(true)
  const [formulaireVisible, setFormulaireVisible] = useState(false)

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
  const fileRef    = useRef<HTMLInputElement>(null)
  const formulaireRef = useRef<HTMLDivElement>(null)

  // Vérifie si l'utilisateur est connecté, pré-remplit les champs depuis son profil
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.role === 'expert') {
          router.push('/expert/dashboard')
          return
        }
        if (data?.user) {
          setSession(data)
          setForm((prev) => ({
            ...prev,
            first_name: data.user.first_name ?? '',
            last_name:  data.user.last_name  ?? '',
            phone:      data.user.phone      ?? '',
          }))
        }
        setChargement(false)
      })
      .catch(() => setChargement(false))
  }, [router])

  // Ouvre le formulaire et scroll dessus - redirige vers login si pas connecté
  function ouvrirFormulaire() {
    if (!session) {
      router.push('/login?redirect=/devenir-expert')
      return
    }
    setFormulaireVisible(true)
    setTimeout(() => formulaireRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

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
        setErreur("Choisissez au moins une catégorie et indiquez vos années d'expérience.")
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
      body: JSON.stringify({ ...form, email: session!.user.email, document_url: documentUrl }),
    })
    const json = await res.json()
    if (!res.ok) { setErreur(json.error); setEnvoi(false); return }
    setEnvoye(true)
    setEnvoi(false)
  }

  if (chargement) return (
    <main className="page-container max-w-3xl mx-auto">
      <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
    </main>
  )

  return (
    <main className="page-container max-w-3xl mx-auto space-y-16">

      {/* HERO */}
      <section className="text-center space-y-5 pt-4">
        <div className="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full">
          Programme experts Avisbox
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white leading-tight">
          Partagez votre expertise.<br className="hidden sm:block" /> Soyez rémunéré.
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg max-w-xl mx-auto">
          Des particuliers belges attendent votre avis professionnel sur leurs devis, diagnostics et documents. Répondez quand vous le souhaitez, sans engagement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={ouvrirFormulaire}
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            Déposer ma candidature
          </button>
          <a href="#comment-ca-marche"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Comment ça marche
          </a>
        </div>
      </section>

      {/* BÉNÉFICES */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-8">Pourquoi rejoindre Avisbox ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {BENEFICES.map((b) => (
            <div key={b.titre} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex gap-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                {b.icone}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm mb-1">{b.titre}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{b.texte}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-8">Comment ça marche pour un expert ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {COMMENT_CA_MARCHE.map((etapeInfo) => (
            <div key={etapeInfo.num} className="text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                {etapeInfo.num}
              </div>
              <p className="font-semibold text-slate-800 dark:text-white">{etapeInfo.titre}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{etapeInfo.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROFILS RECHERCHÉS */}
      <section className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Profils recherchés</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
          {[
            'Mécaniciens et techniciens automobiles',
            'Agents immobiliers et experts en bâtiment',
            'Plombiers, électriciens, maçons, carreleurs, peintres, couvreurs...',
            'Conseilleurs en assurance et experts sinistres',
            'Juristes et spécialistes en droit du travail',
            'Comptables et conseillers fiscaux indépendants',
          ].map((profil) => (
            <div key={profil} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
              {profil}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Actifs ou retraités, particuliers ou sociétés - tant que vous justifiez d'une expertise réelle, vous êtes le bienvenu.
        </p>
      </section>

      {/* CTA avant formulaire */}
      {!formulaireVisible && !envoye && (
        <div className="text-center space-y-3">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Processus de candidature en 3 étapes - moins de 5 minutes.</p>
          <button
            onClick={ouvrirFormulaire}
            className="inline-flex items-center justify-center h-12 px-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            Je dépose ma candidature
          </button>
          {!session && (
            <p className="text-xs text-slate-400">
              Vous devrez vous{' '}
              <Link href="/login?redirect=/devenir-expert" className="text-indigo-600 hover:underline">connecter</Link>
              {' '}ou{' '}
              <Link href="/register?redirect=/devenir-expert" className="text-indigo-600 hover:underline">créer un compte</Link>
              {' '}pour accéder au formulaire.
            </p>
          )}
        </div>
      )}

      {/* FORMULAIRE */}
      {envoye ? (
        <div ref={formulaireRef} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-10 text-center space-y-4">
          <p className="text-4xl font-bold text-green-600">✓</p>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">Candidature envoyée !</h2>
          <p className="text-green-700 dark:text-green-400">
            Nous avons bien reçu votre dossier. Notre équipe l'examine et reviendra vers vous à{' '}
            <strong>{session?.user.email}</strong> dans les 24 à 48 heures.
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">Pensez à vérifier vos spams si vous ne recevez rien.</p>
        </div>
      ) : formulaireVisible && (
        <div ref={formulaireRef} className="scroll-mt-8">
          {/* Bandeau compte connecté */}
          <div className="rounded-xl px-4 py-3 text-sm mb-6 flex items-center justify-between
            bg-indigo-50 border border-indigo-200 text-indigo-800
            dark:bg-indigo-900/80 dark:border-indigo-700 dark:text-indigo-100">
            <span>Connecté en tant que <strong className="font-semibold">{session?.user?.email}</strong></span>
            <Link href="/mon-compte" className="text-indigo-700 dark:text-white hover:underline text-xs font-semibold">Mon compte</Link>
          </div>

          {/* Stepper */}
          <div className="relative flex items-center justify-between mb-8 w-full px-2">
            {ETAPES.map((label, i) => (
              <div key={i} className="flex flex-col items-center min-w-[80px]">
                <div className={`w-8 h-8 rounded-full text-base font-bold flex items-center justify-center ${
                  etape > i ? 'bg-indigo-600 text-white' :
                  etape === i ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {etape > i ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium mt-2 ${etape === i ? 'text-indigo-700' : 'text-slate-400'}`}>{label}</span>
                {i < ETAPES.length - 1 && (
                  <div className="absolute h-0.5 bg-slate-200" style={{ left: `${(i + 0.5) * (100 / ETAPES.length)}%`, width: `${100 / ETAPES.length}%`, top: '16px' }} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-5">

            {/* ETAPE 1 - Profil */}
            {etape === 0 && (
              <>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Vos informations personnelles</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Prénom *</label>
                    <input type="text" value={form.first_name} onChange={(e) => setChamp('first_name', e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Nom *</label>
                    <input type="text" value={form.last_name} onChange={(e) => setChamp('last_name', e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Email</label>
                    <input type="email" value={session?.user?.email ?? ''} disabled
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
                    <p className="text-xs text-slate-400 mt-0.5">L'email de votre compte Avisbox</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Téléphone *</label>
                    <input type="tel" value={form.phone} onChange={(e) => setChamp('phone', e.target.value)}
                      placeholder="04XX XX XX XX"
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Pseudo affiché *</label>
                    <input type="text" value={form.display_name} onChange={(e) => setChamp('display_name', e.target.value)}
                      placeholder="Ex : Marc C. - visible par les clients"
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Ville *</label>
                    <input type="text" value={form.city} onChange={(e) => setChamp('city', e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Présentation (visible sur votre profil)</label>
                  <textarea value={form.bio} onChange={(e) => setChamp('bio', e.target.value)}
                    rows={3} maxLength={500} placeholder="Décrivez votre parcours et votre expertise en quelques phrases..."
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none" />
                  <p className="text-xs text-slate-400 text-right">{form.bio.length}/500</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-2">Langues de réponse</label>
                  <div className="flex gap-3">
                    {[['fr', 'Français'], ['nl', 'Néerlandais'], ['en', 'Anglais']].map(([val, label]) => (
                      <label key={val} className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
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
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Votre expertise</h3>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-2">Catégories *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                      <label key={cat.value}
                        className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm transition-colors duration-150
                          ${form.categories.includes(cat.value)
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-800 dark:bg-indigo-800/80 dark:text-white dark:border-indigo-400 shadow-md'
                            : 'border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-300 hover:border-slate-300'}
                        `}>
                        <input type="checkbox" className="hidden"
                          checked={form.categories.includes(cat.value)}
                          onChange={() => toggleCategorie(cat.value)} />
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors duration-150
                          ${form.categories.includes(cat.value)
                            ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-400'
                            : 'border-slate-300 bg-white dark:bg-slate-800'}
                        `}>
                          {form.categories.includes(cat.value) && <span className="text-white dark:text-indigo-900 text-xs">✓</span>}
                        </span>
                        {cat.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Années d'expérience *</label>
                  <input type="number" min="1" max="60" value={form.years_experience}
                    onChange={(e) => setChamp('years_experience', e.target.value)}
                    className="w-32 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-2">Type de compte *</label>
                  <div className="flex gap-3">
                    {[['individual', 'Particulier'], ['company', 'Société']].map(([val, label]) => (
                      <label key={val} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border cursor-pointer text-sm transition-colors duration-150
                        ${form.entity_type === val
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-800 dark:bg-indigo-800/80 dark:text-white dark:border-indigo-400 shadow-md'
                          : 'border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-300'}
                      `}>
                        <input type="radio" name="entity_type" value={val}
                          checked={form.entity_type === val as 'individual' | 'company'}
                          onChange={() => setChamp('entity_type', val)}
                          className="hidden" />
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-150
                          ${form.entity_type === val ? 'border-indigo-600 bg-indigo-600 dark:bg-indigo-400' : 'border-slate-300 bg-white dark:bg-slate-800'}
                        `}>
                          {form.entity_type === val && <span className="w-2 h-2 rounded-full bg-white dark:bg-indigo-900 block" />}
                        </span>
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {form.entity_type === 'company' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Nom de la société *</label>
                      <input type="text" value={form.company_name} onChange={(e) => setChamp('company_name', e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Numéro BCE</label>
                      <input type="text" value={form.bce_number} onChange={(e) => setChamp('bce_number', e.target.value)}
                        placeholder="BE0123456789" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Numéro TVA</label>
                      <input type="text" value={form.vat_number} onChange={(e) => setChamp('vat_number', e.target.value)}
                        placeholder="BE0123456789" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1">Pourquoi voulez-vous rejoindre Avisbox ?</label>
                  <textarea value={form.motivation} onChange={(e) => setChamp('motivation', e.target.value)}
                    rows={3} placeholder="Décrivez votre motivation..."
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
              </>
            )}

            {/* ETAPE 3 - Justificatif */}
            {etape === 2 && (
              <>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Justificatif professionnel</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Uploadez un document prouvant votre expertise : diplôme, certificat, numéro BCE, carte professionnelle ou extrait de registre de commerce.
                </p>

                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    documentUrl ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  }`}>
                  {documentUrl ? (
                    <div className="space-y-1">
                      <p className="text-green-700 dark:text-green-400 font-medium text-sm">✓ {uploadNom}</p>
                      <p className="text-xs text-green-600 dark:text-green-500">Cliquez pour remplacer</p>
                    </div>
                  ) : uploadEnCours ? (
                    <p className="text-slate-500 text-sm">Envoi en cours...</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Cliquez pour choisir un fichier</p>
                      <p className="text-xs text-slate-400">PDF, JPG ou PNG - max 10 MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={uploadFichier} className="hidden" />

                <div className="bg-amber-50 dark:bg-slate-900/80 border border-amber-200 dark:border-slate-700 rounded-xl p-4 text-sm text-amber-800 dark:text-slate-100">
                  <p className="font-medium mb-1 dark:text-indigo-200">Documents acceptés</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-700 dark:text-indigo-300">
                    <li>Diplôme ou certificat professionnel</li>
                    <li>Numéro BCE belge vérifiable sur bce.fgov.be</li>
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
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  Retour
                </button>
              ) : <div />}

              {etape < ETAPES.length - 1 ? (
                <Button onClick={validerEtape}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                  Continuer
                </Button>
              ) : (
                <Button onClick={soumettre} disabled={envoi || !documentUrl}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                  {envoi ? 'Envoi...' : 'Soumettre ma candidature'}
                </Button>
              )}
            </div>

          </div>
        </div>
      )}

    </main>
  )
}
