'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
// Link est utilisé dans les alertes candidatures/signalements

interface Stats {
  total_demandes: number
  demandes_mois: number
  signalements_en_attente: number
  candidatures_en_attente: number
  experts_actifs: number
  total_utilisateurs: number
  remboursements_mois: number
  ca_mois_cents: number
  avis_recus: number
  avis_en_attente: number
}

// Dashboard principal admin - métriques en temps réel et alertes
export default function AdminPage() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function euros(cents: number) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €'
  }

  const metriques = stats ? [
    { label: 'CA du mois',                valeur: euros(stats.ca_mois_cents),            couleur: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'  },
    { label: 'Avis vendus ce mois',        valeur: String(stats.demandes_mois),           couleur: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
    { label: 'Signalements en attente',    valeur: String(stats.signalements_en_attente), couleur: stats.signalements_en_attente > 0 ? 'text-red-600' : 'text-slate-600', bg: stats.signalements_en_attente > 0 ? 'bg-red-50' : 'bg-slate-50', border: stats.signalements_en_attente > 0 ? 'border-red-200' : 'border-slate-200' },
    { label: 'Candidatures en attente',    valeur: String(stats.candidatures_en_attente), couleur: stats.candidatures_en_attente > 0 ? 'text-amber-600' : 'text-slate-600', bg: stats.candidatures_en_attente > 0 ? 'bg-amber-50' : 'bg-slate-50', border: stats.candidatures_en_attente > 0 ? 'border-amber-200' : 'border-slate-200' },
    { label: 'Experts actifs',             valeur: String(stats.experts_actifs),          couleur: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200'  },
    { label: 'Utilisateurs inscrits',      valeur: String(stats.total_utilisateurs),      couleur: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-slate-200'   },
    { label: 'Remboursements ce mois',     valeur: String(stats.remboursements_mois),     couleur: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200'  },
    { label: 'Total avis rendus',          valeur: String(stats.total_demandes),          couleur: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-slate-200'   },
    { label: 'Avis clients reçus',         valeur: String(stats.avis_recus),              couleur: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200'   },
    { label: 'Avis clients en attente',    valeur: String(stats.avis_en_attente),         couleur: stats.avis_en_attente > 0 ? 'text-orange-600' : 'text-slate-600', bg: stats.avis_en_attente > 0 ? 'bg-orange-50' : 'bg-slate-50', border: stats.avis_en_attente > 0 ? 'border-orange-200' : 'border-slate-200', lien: '/admin/avis' },
  ] : []

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de Avisbox en temps réel</p>
        </div>
        <button onClick={() => { setLoading(true); fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false) }) }}
          className="text-xs text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
          Rafraîchir
        </button>
      </div>

      {/* Alerte candidatures */}
      {stats && stats.candidatures_en_attente > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-500 text-xl">✎</span>
            <div>
              <p className="font-semibold text-amber-800">
                {stats.candidatures_en_attente} candidature{stats.candidatures_en_attente > 1 ? 's' : ''} expert en attente de traitement
              </p>
              <p className="text-amber-600 text-sm">Ces dossiers nécessitent votre validation.</p>
            </div>
          </div>
          <Link href="/admin/candidatures" className="text-sm font-medium text-amber-700 underline hover:text-amber-900">
            Traiter →
          </Link>
        </div>
      )}

      {/* Alerte signalements */}
      {stats && stats.signalements_en_attente > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-xl">⚑</span>
            <div>
              <p className="font-semibold text-red-800">
                {stats.signalements_en_attente} signalement{stats.signalements_en_attente > 1 ? 's' : ''} en attente d'arbitrage
              </p>
              <p className="text-red-600 text-sm">Ces dossiers nécessitent votre décision.</p>
            </div>
          </div>
          <Link href="/admin/signalements" className="text-sm font-medium text-red-700 underline hover:text-red-900">
            Traiter →
          </Link>
        </div>
      )}

      {/* Métriques */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metriques.map((m: any) => (
            m.lien ? (
              <Link key={m.label} href={m.lien} className={`${m.bg} border ${m.border} rounded-xl p-5 hover:opacity-80 transition-opacity`}>
                <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                <p className={`text-2xl font-bold ${m.couleur}`}>{m.valeur}</p>
              </Link>
            ) : (
              <div key={m.label} className={`${m.bg} border ${m.border} rounded-xl p-5`}>
                <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                <p className={`text-2xl font-bold ${m.couleur}`}>{m.valeur}</p>
              </div>
            )
          ))}
        </div>
      )}

    </div>
  )
}
