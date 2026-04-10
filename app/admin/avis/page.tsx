'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CATEGORY_LABELS: Record<string, string> = {
  mecanique: 'Mécanique', immo: 'Immobilier', travaux: 'Travaux',
  assurance: 'Assurance', travail: 'Droit travail', comptabilite: 'Comptabilité',
}

interface AvisItem {
  id: string
  delivered_at: string
  verdict: string | null
  request_id: string
  request_title: string
  request_category: string
  user_first_name: string
  user_last_name: string
  user_email: string
  expert_name: string
  expert_email: string
  jours_depuis: number
  rated: boolean
  rating: { score: number; comment: string | null; created_at: string } | null
}

// Page admin - suivi des avis clients sur les réponses des experts
export default function AdminAvisPage() {
  const [avis, setAvis]           = useState<AvisItem[]>([])
  const [stats, setStats]         = useState({ recus: 0, en_attente: 0 })
  const [loading, setLoading]     = useState(true)
  const [onglet, setOnglet]       = useState<'unrated' | 'rated'>('unrated')
  const [email, setEmail]         = useState('')
  const [rappels, setRappels]     = useState<Set<string>>(new Set())
  const [envoi, setEnvoi]         = useState<string | null>(null)

  const charger = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ filter: onglet })
    if (email.trim()) params.set('email', email.trim())
    fetch(`/api/admin/avis?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setAvis(data.avis ?? [])
        if (data.stats) setStats(data.stats)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [onglet, email])

  useEffect(() => { charger() }, [charger])
  useEffect(() => {
    const t = setTimeout(() => charger(), 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  // Envoie un email de rappel au client pour qu'il laisse son avis
  async function envoyerRappel(answerId: string) {
    setEnvoi(answerId)
    const res = await fetch('/api/admin/avis/remind', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ answer_id: answerId }),
    })
    if (res.ok) setRappels((prev) => new Set([...prev, answerId]))
    setEnvoi(null)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Avis clients</h1>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-xs text-slate-500 mb-1">Avis reçus</p>
          <p className="text-3xl font-bold text-green-600">{stats.recus}</p>
        </div>
        <div className={`border rounded-xl p-5 text-center ${stats.en_attente > 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-xs text-slate-500 mb-1">Avis en attente</p>
          <p className={`text-3xl font-bold ${stats.en_attente > 0 ? 'text-orange-600' : 'text-slate-600'}`}>{stats.en_attente}</p>
        </div>
      </div>

      {/* Recherche + onglets */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Rechercher par email client..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64"
        />
      </div>
      <div className="flex gap-1 border-b border-slate-200">
        {([
          { key: 'unrated', label: `En attente (${stats.en_attente})` },
          { key: 'rated',   label: `Reçus (${stats.recus})` },
        ] as const).map((o) => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              onglet === o.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : avis.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucun résultat.</p>
      ) : (
        <div className="space-y-3">
          {avis.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Infos demande */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[item.request_category] ?? item.request_category}
                    </span>
                    {!item.rated && item.jours_depuis >= 5 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        {item.jours_depuis} j sans avis
                      </span>
                    )}
                    {!item.rated && item.jours_depuis < 5 && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {item.jours_depuis} j depuis la réponse
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-slate-800 truncate">{item.request_title}</p>
                  {item.verdict && <p className="text-xs text-slate-500 italic">"{item.verdict}"</p>}

                  {/* Infos client */}
                  <p className="text-xs text-slate-400">
                    Client : {item.user_first_name} {item.user_last_name} · {item.user_email}
                  </p>
                  <p className="text-xs text-slate-400">
                    Expert : {item.expert_name}{item.expert_email ? ` · ${item.expert_email}` : ''} · Réponse le {new Date(item.delivered_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {item.rated && item.rating && (
                    <p className="text-xs text-slate-400">
                      Noté par le client le {new Date(item.rating.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}

                  {/* Avis reçu */}
                  {item.rated && item.rating && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1,2,3,4,5].map((i) => (
                          <span key={i} className={`text-sm ${i <= item.rating!.score ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{item.rating.score}/5</span>
                      {item.rating.comment && (
                        <span className="text-xs text-slate-500 italic">- "{item.rating.comment}"</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/admin/demandes/${item.request_id}`}
                    className="text-xs text-indigo-600 hover:underline border border-indigo-200 px-2 py-1 rounded">
                    Dossier →
                  </Link>
                  {/* Bouton rappel pour toute réponse sans avis */}
                  {!item.rated && (
                    rappels.has(item.id)
                      ? <span className="text-xs text-green-600 font-medium">Rappel envoyé</span>
                      : <Button size="sm" variant="outline"
                          onClick={() => envoyerRappel(item.id)}
                          disabled={envoi === item.id}
                          className="text-xs h-7 px-2 border-orange-200 text-orange-700 hover:bg-orange-50">
                          {envoi === item.id ? '...' : 'Envoyer rappel'}
                        </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
