'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  mecanique: 'Mécanique', immo: 'Immobilier', travaux: 'Travaux',
  assurance: 'Assurance', travail: 'Droit travail', comptabilite: 'Comptabilité',
}

interface Expert {
  id: string
  display_name: string
  first_name: string
  last_name: string
  email: string
  city: string
  categories: string[]
  average_rating: number
  total_answers: number
  total_signals: number
  is_verified: boolean
  is_active: boolean
  is_blocked: boolean
  suspension_reason: string | null
  suspension_type: string | null
  charte_signee: boolean
  created_at: string
}

// Page admin - liste des experts avec recherche et filtres
export default function AdminExpertsPage() {
  const [experts, setExperts]   = useState<Expert[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [status, setStatus]     = useState('all')
  const [category, setCategory] = useState('')

  const charger = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ q, status, category })
    fetch(`/api/admin/experts?${params}`)
      .then((r) => r.json())
      .then((data) => { setExperts(data.experts ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [q, status, category])

  useEffect(() => {
    const t = setTimeout(charger, 300)
    return () => clearTimeout(t)
  }, [charger])

  function badgeStatut(e: Expert) {
    if (!e.is_verified) return <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Non vérifié</span>
    if (!e.is_active && e.is_blocked) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Suspendu (manuel)</span>
    if (!e.is_active) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Suspendu (auto)</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Actif</span>
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Experts</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par nom, email, ville, téléphone..."
          className="flex-1 min-w-64 border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
          <option value="pending">Non vérifiés</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes les catégories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <p className="text-sm text-slate-500">{experts.length} résultat{experts.length > 1 ? 's' : ''}</p>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : experts.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucun expert trouvé.</p>
      ) : (
        <div className="space-y-3">
          {experts.map((e) => (
            <div key={e.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-semibold text-slate-900 text-sm">{e.display_name}</p>
                  <span className="text-slate-400 text-xs">({e.first_name} {e.last_name})</span>
                  {badgeStatut(e)}
                </div>
                <p className="text-xs text-slate-500">{e.email} · {e.city}</p>
                {e.suspension_reason && (
                  <p className="text-xs text-red-600 mt-0.5">Raison : {e.suspension_reason}</p>
                )}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {e.categories.slice(0, 3).map((c) => (
                    <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{CATEGORY_LABELS[c] ?? c}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-right">
                <div className="hidden sm:block text-xs text-slate-500">
                  <p>★ {e.average_rating.toFixed(1)} · {e.total_answers} rép.</p>
                  <p>{e.total_signals} signalement{e.total_signals > 1 ? 's' : ''}</p>
                </div>
                {/* Badge charte */}
                {e.charte_signee
                  ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium hidden sm:inline">Charte ✓</span>
                  : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium hidden sm:inline">Sans charte</span>
                }
                <Link href={`/admin/experts/${e.id}`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                  Voir le profil
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
