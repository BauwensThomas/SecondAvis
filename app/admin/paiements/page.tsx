'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const TYPE_LABELS: Record<string, { label: string; couleur: string; bg: string }> = {
  paiement:      { label: 'Paiement client',      couleur: 'text-green-700',  bg: 'bg-green-100'  },
  remboursement: { label: 'Remboursement',         couleur: 'text-blue-700',   bg: 'bg-blue-100'   },
  virement:      { label: 'Virement expert',       couleur: 'text-indigo-700', bg: 'bg-indigo-100' },
}

const STATUT_STYLES: Record<string, string> = {
  'payé':        'bg-green-100 text-green-700',
  'remboursé':   'bg-blue-100 text-blue-700',
  'en attente':  'bg-amber-100 text-amber-700',
}

// Page admin - historique complet des mouvements financiers (paiements, remboursements, virements)
export default function AdminPaiementsPage() {
  const [mouvements, setMouvements] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [email, setEmail]           = useState('')
  const [type, setType]             = useState('all')
  const [statut, setStatut]         = useState('all')

  const charger = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ type, status: statut })
    if (email.trim()) params.set('email', email.trim())
    fetch(`/api/admin/paiements?${params}`)
      .then((r) => r.json())
      .then((d) => { setMouvements(d.mouvements ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [email, type, statut])

  // Recharge avec debounce sur le champ email
  useEffect(() => {
    const t = setTimeout(charger, 300)
    return () => clearTimeout(t)
  }, [charger])

  function euros(cents: number) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €'
  }

  // Totaux des mouvements affichés
  const totalPaiements      = mouvements.filter((m) => m.type === 'paiement').reduce((a, m) => a + m.montant_cents, 0)
  const totalRemboursements = mouvements.filter((m) => m.type === 'remboursement').reduce((a, m) => a + m.montant_cents, 0)
  const totalVirements      = mouvements.filter((m) => m.type === 'virement').reduce((a, m) => a + m.montant_cents, 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paiements et remboursements</h1>
        <p className="text-sm text-slate-500 mt-1">Tous les mouvements financiers de la plateforme</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Rechercher par email..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64"
        />
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">Tous les types</option>
          <option value="paiement">Paiements clients</option>
          <option value="remboursement">Remboursements</option>
          <option value="virement">Virements experts</option>
        </select>
        <select value={statut} onChange={(e) => setStatut(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">Tous les statuts</option>
          <option value="paid">Payé</option>
          <option value="pending">En attente</option>
          <option value="refunded">Remboursé</option>
        </select>
      </div>

      {/* Résumé des totaux affichés */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Paiements clients</p>
          <p className="text-xl font-bold text-green-600">{euros(totalPaiements)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Remboursements</p>
          <p className="text-xl font-bold text-blue-600">{euros(totalRemboursements)}</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Virements experts</p>
          <p className="text-xl font-bold text-indigo-600">{euros(totalVirements)}</p>
        </div>
      </div>

      <p className="text-sm text-slate-500">{mouvements.length} mouvement{mouvements.length > 1 ? 's' : ''}</p>

      {/* Liste */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : mouvements.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucun mouvement trouvé.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-left px-5 py-3">Description</th>
                <th className="text-left px-5 py-3">Compte</th>
                <th className="text-right px-5 py-3">Montant</th>
                <th className="text-left px-5 py-3">Statut</th>
                <th className="text-left px-5 py-3">Réf. Stripe</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.map((m) => {
                const typeInfo = TYPE_LABELS[m.type]
                return (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(m.date).toLocaleString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.bg} ${typeInfo.couleur}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-800 max-w-48">
                      <p className="truncate text-sm">{m.label}</p>
                      {m.raison && (
                        <p className="text-xs text-slate-400 truncate">Raison : {m.raison}</p>
                      )}
                      {m.request_id && (
                        <Link href={`/admin/demandes/${m.request_id}`} className="text-xs text-indigo-500 hover:underline">
                          Voir le dossier →
                        </Link>
                      )}
                      {m.expert_id && (
                        <Link href={`/admin/experts/${m.expert_id}`} className="text-xs text-indigo-500 hover:underline">
                          Voir l'expert →
                        </Link>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      <p>{m.user_nom}</p>
                      <p className="text-slate-400">{m.user_email}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      <span className={m.type === 'paiement' ? 'text-green-700' : m.type === 'remboursement' ? 'text-blue-700' : 'text-indigo-700'}>
                        {m.type === 'paiement' ? '+' : '-'}{euros(m.montant_cents)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_STYLES[m.statut] ?? 'bg-slate-100 text-slate-600'}`}>
                        {m.statut}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 font-mono">
                      {m.stripe_ref ? <span title={m.stripe_ref}>{String(m.stripe_ref).slice(0, 14)}…</span> : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
