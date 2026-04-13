'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  mecanique: 'Mécanique', immo: 'Immobilier', travaux: 'Travaux',
  assurance: 'Assurance', travail: 'Droit travail', comptabilite: 'Comptabilité',
}
const RAISON_LABELS: Record<string, string> = {
  vague: 'Réponse vague ou inutile',
  incorrecte: 'Informations incorrectes',
  solicitation: 'Solicitation commerciale',
  abusif: 'Contenu abusif',
  autre: 'Autre raison',
}

// Page admin - liste de tous les signalements avec filtres
export default function AdminSignalementsPage() {
  const [signalements, setSignalements] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [status, setStatus]             = useState('pending')
  const [category, setCategory]         = useState('')
  const [recherche, setRecherche]       = useState('')

  const charger = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ status, category })
    if (recherche.trim()) params.set('q', recherche.trim())
    fetch(`/api/admin/signalements?${params}`)
      .then((r) => r.json())
      .then((data) => { setSignalements(data.signalements ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, category])

  useEffect(() => { charger() }, [charger])
  // Recharge si la recherche change (avec délai)
  useEffect(() => {
    const t = setTimeout(() => charger(), 300)
    return () => clearTimeout(t)
  }, [recherche]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Signalements</h1>
        {signalements.filter((s) => !s.contest_resolved).length > 0 && (
          <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
            {signalements.filter((s) => !s.contest_resolved).length} en attente
          </span>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher par titre ou expert..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-72"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="pending">En attente</option>
          <option value="resolved">Résolus</option>
          <option value="all">Tous</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes les catégories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <p className="text-sm text-slate-500">{signalements.length} résultat{signalements.length > 1 ? 's' : ''}</p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : signalements.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucun signalement trouvé.</p>
      ) : (
        <div className="space-y-3">
          {signalements.map((s: any) => (
            <div
              key={s.id}
              className={`bg-white rounded-xl px-5 py-4 flex items-center justify-between gap-4 
                ${!s.contest_resolved ? 'border-2 border-yellow-400 shadow-[0_0_0_2px_rgba(251,191,36,0.15)]' : 'border border-slate-200'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {CATEGORY_LABELS[s.requests?.category] ?? s.requests?.category}
                  </span>
                  {s.contest_resolved
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Résolu</span>
                    : <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">En attente</span>
                  }
                </div>
                <p className="font-medium text-slate-900 text-sm truncate">{s.requests?.title ?? 'Demande inconnue'}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {RAISON_LABELS[s.contest_reason] ?? s.contest_reason} ·{' '}
                  Expert : {s.experts?.display_name ?? '-'} ·{' '}
                  {new Date(s.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                {s.contest_resolved && s.contest_decision && (
                  <p className="text-xs mt-0.5 font-medium">
                    {s.contest_decision === 'validate'
                      ? <span className="text-green-700">Réponse validée</span>
                      : <span className="text-red-700">Client remboursé</span>
                    }
                    {s.admin_decision_at && (
                      <span className="text-slate-400 font-normal ml-1">
                        · le {new Date(s.admin_decision_at).toLocaleString('fr-BE', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <Link href={`/admin/signalements/${s.id}`}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border shrink-0 transition-colors ${
                  s.contest_resolved
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    : 'border-red-200 text-red-700 hover:bg-red-50 font-semibold'
                }`}>
                {s.contest_resolved ? 'Voir' : 'Traiter →'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
