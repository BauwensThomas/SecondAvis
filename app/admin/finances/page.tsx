'use client'

import { useEffect, useState } from 'react'

// Page admin - vue financière sur 6 mois (revenus, remboursements, virements, marge)
export default function AdminFinancesPage() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/finances')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function euros(cents: number) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €'
  }

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1,2,3].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (!data || !data.summary) return <div className="p-8 text-red-600">Impossible de charger les données financières.</div>

  const { summary, monthly_data } = data

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Finances</h1>

      {/* Résumé global */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CA total (brut)', valeur: euros(summary.ca_total_cents),         couleur: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200' },
          { label: 'Remboursés',      valeur: euros(summary.remboursements_cents),    couleur: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200'   },
          { label: 'Virés aux experts',valeur: euros(summary.virements_experts_cents),couleur: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200'  },
          { label: 'Marge nette',     valeur: euros(summary.marge_nette_cents),       couleur: 'text-indigo-600',bg: 'bg-indigo-50', border: 'border-indigo-200'},
        ].map((m) => (
          <div key={m.label} className={`${m.bg} border ${m.border} rounded-xl p-5`}>
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className={`text-2xl font-bold ${m.couleur}`}>{m.valeur}</p>
          </div>
        ))}
      </div>

      {/* Tableau mensuel */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Données mensuelles (6 derniers mois)</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Mois</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Avis vendus</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">CA brut</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Remboursés</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Virés experts</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Marge nette</th>
              </tr>
            </thead>
            <tbody>
              {(monthly_data ?? []).map((row: any, i: number) => (
                <tr key={i} className={`border-b border-slate-100 last:border-0 ${i === 0 ? 'font-medium' : ''}`}>
                  <td className="px-5 py-3 text-slate-800">{row.mois}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{row.avis_vendus}</td>
                  <td className="px-5 py-3 text-right text-green-700">{euros(row.ca_brut_cents)}</td>
                  <td className="px-5 py-3 text-right text-red-600">{euros(row.remboursements_cents)}</td>
                  <td className="px-5 py-3 text-right text-blue-600">{euros(row.virements_cents)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-indigo-700">{euros(row.marge_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note frais Stripe */}
      <p className="text-xs text-slate-400">
        Marge nette = CA brut − Remboursements − Virements experts − Frais Stripe estimés (2,9% + 0,25 € par transaction).
        Les frais Stripe réels peuvent varier légèrement.
      </p>
    </div>
  )
}
