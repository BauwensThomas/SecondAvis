'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'

const TYPE_LABELS: Record<string, string> = {
  access: 'Accès aux données',
  rectification: 'Rectification',
  erasure: 'Effacement (droit à l\'oubli)',
  portability: 'Portabilité',
}
const STATUT_LABELS: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Traité',
}

// Page admin - gestion des demandes RGPD (accès, rectification, effacement, portabilité)
export default function AdminRgpdPage() {
  const [demandes, setDemandes] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState('pending')
  const [email, setEmail]       = useState('')
  const [traitement, setTraitement] = useState<any | null>(null)
  const [notes, setNotes]       = useState('')
  const [envoi, setEnvoi]       = useState(false)

  const charger = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ status })
    if (email.trim()) params.set('email', email.trim())
    fetch(`/api/admin/gdpr?${params}`)
      .then((r) => r.json())
      .then((data) => { setDemandes(data.requests ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, email])

  useEffect(() => { charger() }, [charger])

  // Exporte les données en JSON
  async function exporter(id: string, requesterId: string, requesterType: string) {
    const res = await fetch(`/api/admin/gdpr?export=true&id=${id}&requester_id=${requesterId}&requester_type=${requesterType}`)
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `export-rgpd-${requesterId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Marque la demande comme traitée
  async function marquerTraite(id: string) {
    setEnvoi(true)
    const res = await fetch(`/api/admin/gdpr/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', notes }),
    })
    if (res.ok) {
      setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, status: 'completed' } : d))
      setTraitement(null)
      setNotes('')
    }
    setEnvoi(false)
  }

  // Exécute la suppression réelle du compte (effacement RGPD)
  async function supprimerCompte(id: string, email: string) {
    if (!confirm(`Supprimer définitivement le compte de ${email} ?\n\nCette action est irréversible. Un email de confirmation sera envoyé au client.`)) return
    setEnvoi(true)
    const res = await fetch(`/api/admin/gdpr/${id}/execute`, { method: 'POST' })
    if (res.ok) {
      setDemandes((prev) => prev.map((d) => d.id === id ? { ...d, status: 'completed' } : d))
      setTraitement(null)
      alert('Compte supprimé. Un email de confirmation a été envoyé.')
    } else {
      const data = await res.json()
      alert(`Erreur : ${data.error}`)
    }
    setEnvoi(false)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">RGPD</h1>
        <p className="text-sm text-slate-500 mt-1">Demandes d'exercice des droits (délai légal : 30 jours)</p>
      </div>

      {/* Barre de recherche + filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Rechercher par email..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64"
        />
      </div>

      {/* Filtre statut */}
      <div className="flex gap-3">
        {(['pending', 'in_progress', 'completed', 'all'] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              status === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}>
            {s === 'all' ? 'Toutes' : STATUT_LABELS[s]}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500">{demandes.length} demande{demandes.length > 1 ? 's' : ''}</p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : demandes.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucune demande RGPD.</p>
      ) : (
        <div className="space-y-3">
          {demandes.map((d: any) => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-2">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-medium text-slate-900 text-sm">{TYPE_LABELS[d.request_type] ?? d.request_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      d.status === 'completed'   ? 'bg-green-100 text-green-700' :
                      d.status === 'in_progress' ? 'bg-blue-100 text-blue-700'  :
                      'bg-amber-100 text-amber-700'
                    }`}>{STATUT_LABELS[d.status] ?? d.status}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {d.requester_type === 'user' ? 'Client' : 'Expert'} · {d.requester_email} ·{' '}
                    Reçue le {new Date(d.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {d.resolved_at && (
                      <> · <span className="text-green-600">Traitée le {new Date(d.resolved_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></>
                    )}
                  </p>
                  {d.notes && <p className="text-xs text-slate-600 mt-1 italic">{d.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {(d.request_type === 'access' || d.request_type === 'portability') && (
                    <button onClick={() => exporter(d.id, d.requester_id, d.requester_type)}
                      className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50">
                      Exporter JSON
                    </button>
                  )}
                  {d.status !== 'completed' && (
                    <Button size="sm" onClick={() => { setTraitement(d); setNotes(d.notes ?? '') }}>
                      Traiter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale traitement */}
      {traitement && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-bold text-slate-900 text-lg">Traitement de la demande</h2>
            <p className="text-sm text-slate-600">
              {TYPE_LABELS[traitement.request_type]} - {traitement.requester_email}
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Notes internes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={3} placeholder="Comment avez-vous traité cette demande ?"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex gap-3 flex-wrap">
              {traitement.request_type === 'erasure' && traitement.status !== 'completed' && (
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => supprimerCompte(traitement.id, traitement.requester_email)} disabled={envoi}>
                  {envoi ? '...' : 'Supprimer le compte'}
                </Button>
              )}
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => marquerTraite(traitement.id)} disabled={envoi}>
                {envoi ? '...' : 'Marquer comme traité'}
              </Button>
              <Button variant="outline" onClick={() => setTraitement(null)}>Annuler</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
