'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const STATUT_LABELS: Record<string, string> = {
  pending: 'En attente', answered: 'Répondu', contested: 'Contesté',
  refunded: 'Remboursé', closed: 'Terminé',
}
const CATEGORY_LABELS: Record<string, string> = {
  mecanique: 'Mécanique', immo: 'Immobilier', travaux: 'Travaux',
  assurance: 'Assurance', travail: 'Droit travail', comptabilite: 'Comptabilité',
}

// Page admin - liste de toutes les demandes avec filtres et remboursement manuel
export default function AdminDemandesPage() {
  const [demandes, setDemandes]     = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [q, setQ]                   = useState('')
  const [status, setStatus]         = useState('all')
  const [category, setCategory]     = useState('')
  const [remb, setRemb]             = useState<string | null>(null)
  // Etat de la modale de suppression
  const [deleteId, setDeleteId]         = useState<string | null>(null)
  const [deleteRaison, setDeleteRaison] = useState('')
  const [deleteRemb, setDeleteRemb]     = useState(false)
  const [deleteEnvoi, setDeleteEnvoi]   = useState(false)
  const [deleteErreur, setDeleteErreur] = useState('')

  const charger = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ q, status, category })
    fetch(`/api/admin/demandes?${params}`)
      .then((r) => r.json())
      .then((data) => { setDemandes(data.requests ?? data.demandes ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [q, status, category])

  useEffect(() => {
    const t = setTimeout(charger, 300)
    return () => clearTimeout(t)
  }, [charger])

  // Suppression d'une demande avec raison et remboursement optionnel
  async function supprimerDemande() {
    if (!deleteId || !deleteRaison.trim()) return
    setDeleteEnvoi(true)
    setDeleteErreur('')
    const res = await fetch(`/api/admin/demandes/${deleteId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raison: deleteRaison, rembourser: deleteRemb }),
    })
    if (res.ok) {
      const nouveauStatut = deleteRemb ? 'refunded' : 'closed'
      setDemandes((prev) => prev.map((d) => d.id === deleteId ? { ...d, status: nouveauStatut } : d))
      setDeleteId(null)
      setDeleteRaison('')
      setDeleteRemb(false)
    } else {
      const data = await res.json()
      setDeleteErreur(data.error ?? 'Erreur lors de la suppression.')
    }
    setDeleteEnvoi(false)
  }

  // Remboursement manuel d'une demande
  async function rembourser(id: string) {
    if (!confirm('Rembourser manuellement cette demande ?')) return
    setRemb(id)
    const res = await fetch(`/api/admin/demandes/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Remboursement manuel admin' }),
    })
    if (res.ok) {
      setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, status: 'refunded' } : d))
    } else {
      alert('Erreur lors du remboursement.')
    }
    setRemb(null)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Demandes</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par titre, client, expert..."
          className="flex-1 min-w-64 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="answered">Répondus</option>
          <option value="contested">Contestés</option>
          <option value="refunded">Remboursés</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes les catégories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <p className="text-sm text-slate-500">{demandes.length} résultat{demandes.length > 1 ? 's' : ''}</p>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : demandes.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucune demande trouvée.</p>
      ) : (
        <div className="space-y-3">
          {demandes.map((d: any) => (
            <div
              key={d.id}
              className={`bg-white rounded-xl px-5 py-3 flex items-center justify-between gap-4 
                ${d.status === 'pending' ? 'border-2 border-yellow-400 shadow-[0_0_0_2px_rgba(251,191,36,0.15)]' : 'border border-slate-200'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {CATEGORY_LABELS[d.category] ?? d.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    d.status === 'answered'  ? 'bg-green-100 text-green-700'  :
                    d.status === 'refunded'  ? 'bg-blue-100 text-blue-700'    :
                    d.status === 'contested' ? 'bg-orange-100 text-orange-700':
                    'bg-slate-100 text-slate-600'
                  }`}>{STATUT_LABELS[d.status] ?? d.status}</span>
                </div>
                <p className="font-medium text-slate-800 text-sm truncate">{d.title}</p>
                <p className="text-xs text-slate-400">
                  {d.users?.first_name} {d.users?.last_name} ·{' '}
                  {((d.amount_cents ?? 0) / 100).toFixed(2).replace('.', ',')} € ·{' '}
                  {new Date(d.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {d.status === 'pending' && (
                  <Button size="sm" variant="outline"
                    onClick={() => rembourser(d.id)} disabled={remb === d.id}>
                    {remb === d.id ? '...' : 'Rembourser'}
                  </Button>
                )}
                {/* Bouton supprimer - visible pour toutes les demandes non deja fermees */}
                {d.status !== 'closed' && d.status !== 'refunded' && (
                  <Button size="sm" variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => { setDeleteId(d.id); setDeleteRaison(''); setDeleteRemb(false); setDeleteErreur('') }}>
                    Supprimer
                  </Button>
                )}
                <Link href={`/admin/demandes/${d.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50">
                  Voir →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modale de suppression */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Supprimer cette demande</h2>
            <p className="text-sm text-slate-500">
              Un email sera envoyé au client avec la raison. Cette action est irréversible.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Raison de la suppression <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deleteRaison}
                onChange={(e) => setDeleteRaison(e.target.value)}
                rows={3}
                placeholder="Ex : Contenu inapproprié, ne respecte pas les conditions d'utilisation..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteRemb}
                onChange={(e) => setDeleteRemb(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">
                Rembourser le client (si de bonne foi)
              </span>
            </label>

            {deleteErreur && (
              <p className="text-sm text-red-600">{deleteErreur}</p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" size="sm"
                onClick={() => setDeleteId(null)} disabled={deleteEnvoi}>
                Annuler
              </Button>
              <Button size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={supprimerDemande}
                disabled={deleteEnvoi || !deleteRaison.trim()}>
                {deleteEnvoi ? 'Suppression...' : 'Confirmer la suppression'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
