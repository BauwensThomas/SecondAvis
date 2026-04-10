'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  is_blocked: boolean
  created_at: string
}

// Page admin - liste des clients avec recherche et blocage rapide
export default function AdminUtilisateursPage() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [status, setStatus]   = useState('all')
  const [envoi, setEnvoi]         = useState<string | null>(null)
  const [modaleId, setModaleId]   = useState<string | null>(null)
  const [raison, setRaison]       = useState('')
  const [erreurModale, setErreurModale] = useState('')

  const charger = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ q, status })
    fetch(`/api/admin/utilisateurs?${params}`)
      .then((r) => r.json())
      .then((data) => { setUsers(data.users ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [q, status])

  useEffect(() => {
    const t = setTimeout(charger, 300)
    return () => clearTimeout(t)
  }, [charger])

  // Déblocage immédiat ou ouverture de la modale pour le blocage
  async function toggleBlocage(id: string, bloquer: boolean) {
    if (bloquer) {
      setModaleId(id)
      setRaison('')
      setErreurModale('')
      return
    }
    // Déblocage sans raison
    setEnvoi(id)
    const res = await fetch(`/api/admin/utilisateurs/${id}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked: false }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_blocked: false } : u))
    }
    setEnvoi(null)
  }

  // Confirme le blocage avec la raison saisie dans la modale
  async function confirmerBlocage() {
    if (!raison.trim()) { setErreurModale('La raison est obligatoire.'); return }
    if (!modaleId) return
    setEnvoi(modaleId)
    const res = await fetch(`/api/admin/utilisateurs/${modaleId}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked: true, reason: raison }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === modaleId ? { ...u, is_blocked: true } : u))
      setModaleId(null)
      setRaison('')
    } else {
      const d = await res.json()
      setErreurModale(d.error ?? 'Erreur.')
    }
    setEnvoi(null)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>

      <div className="flex flex-wrap gap-3">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par nom, email, téléphone..."
          className="flex-1 min-w-64 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="blocked">Bloqués</option>
        </select>
      </div>

      <p className="text-sm text-slate-500">{users.length} résultat{users.length > 1 ? 's' : ''}</p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 text-sm">{u.first_name} {u.last_name}</p>
                  {u.is_blocked && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Bloqué</span>}
                </div>
                <p className="text-xs text-slate-500">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                <p className="text-xs text-slate-400">Inscrit le {new Date(u.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleBlocage(u.id, !u.is_blocked)}
                  disabled={envoi === u.id}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    u.is_blocked
                      ? 'border-green-200 text-green-700 hover:bg-green-50'
                      : 'border-red-200 text-red-700 hover:bg-red-50'
                  }`}>
                  {envoi === u.id ? '...' : u.is_blocked ? 'Débloquer' : 'Bloquer'}
                </button>
                <Link href={`/admin/utilisateurs/${u.id}`}
                  className="text-xs font-medium text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50">
                  Voir
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale de blocage avec raison obligatoire */}
      {modaleId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-bold text-slate-900 text-lg">Bloquer ce compte</h2>
            <p className="text-sm text-slate-600">
              {users.find((u) => u.id === modaleId)?.email}
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Raison du blocage <span className="text-red-500">*</span>
              </label>
              <textarea
                value={raison}
                onChange={(e) => setRaison(e.target.value)}
                rows={3}
                placeholder="Ex : comportement abusif, fausse demande, fraude..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            {erreurModale && <p className="text-sm text-red-600">{erreurModale}</p>}
            <div className="flex gap-3">
              <button
                onClick={confirmerBlocage}
                disabled={!!envoi || !raison.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
                {envoi ? '...' : 'Confirmer le blocage'}
              </button>
              <button
                onClick={() => { setModaleId(null); setRaison(''); setErreurModale('') }}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
