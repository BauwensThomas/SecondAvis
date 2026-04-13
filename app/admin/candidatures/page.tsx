'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CATEGORY_LABELS: Record<string, string> = {
  mecanique: 'Mécanique', immo: 'Immobilier', travaux: 'Travaux',
  assurance: 'Assurance', travail: 'Droit travail', comptabilite: 'Comptabilité',
}

// Page admin - candidatures experts en attente de validation
export default function AdminCandidaturesPage() {
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [status, setStatus]             = useState('pending')
  const [q, setQ]                       = useState('')

  // Modale de décision
  const [modal, setModal]       = useState<any | null>(null)
  const [message, setMessage]   = useState('')
  const [envoi, setEnvoi]       = useState(false)

  const charger = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ status, q })
    fetch(`/api/admin/candidatures?${params}`)
      .then((r) => r.json())
      .then((data) => { setCandidatures(data.candidatures ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, q])

  useEffect(() => {
    const t = setTimeout(charger, 300)
    return () => clearTimeout(t)
  }, [charger])

  // Approuve ou refuse une candidature
  async function decider(id: string, approved: boolean) {
    setEnvoi(true)
    const res = await fetch(`/api/admin/candidatures/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, message }),
    })
    const json = await res.json()
    if (res.ok) {
      setCandidatures((prev) => prev.map((c) =>
        c.id === id ? { ...c, status: approved ? 'approved' : 'rejected' } : c
      ))
      setModal(null)
      setMessage('')
    } else {
      alert(json.error || 'Erreur.')
    }
    setEnvoi(false)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Candidatures experts</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="flex-1 min-w-64 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
          <option value="all">Toutes</option>
        </select>
      </div>

      <p className="text-sm text-slate-500">{candidatures.length} résultat{candidatures.length > 1 ? 's' : ''}</p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : candidatures.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucune candidature.</p>
      ) : (
        <div className="space-y-3">
          {candidatures.map((c: any) => (
            <div
              key={c.id}
              className={`bg-white rounded-xl px-5 py-4 space-y-3 
                ${c.status === 'pending' ? 'border-2 border-yellow-400 shadow-[0_0_0_2px_rgba(251,191,36,0.15)]' : 'border border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-900 text-sm">{c.first_name} {c.last_name}</p>
                    <span className="text-xs text-slate-500">- {c.display_name}</span>
                    {c.status === 'pending' && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">En attente</span>}
                    {c.status === 'approved' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Approuvée</span>}
                    {c.status === 'rejected' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Refusée</span>}
                  </div>
                  <p className="text-xs text-slate-500">{c.email} · {c.city} · {c.years_experience} ans d'expérience</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(c.categories ?? []).map((cat: string) => (
                      <span key={cat} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.document_url && (
                    <a href={c.document_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50">
                      Justificatif →
                    </a>
                  )}
                  {c.status === 'pending' && (
                    <Button size="sm" onClick={() => { setModal(c); setMessage('') }}>
                      Traiter
                    </Button>
                  )}
                </div>
              </div>
              {c.motivation && (
                <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3">
                  <span className="font-medium text-slate-700">Motivation :</span> {c.motivation}
                </p>
              )}
              <p className="text-xs text-slate-400">Candidature soumise le {new Date(c.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modale de décision */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Décision pour {modal.first_name} {modal.last_name}</h2>
            <p className="text-sm text-slate-600">
              Catégories : {(modal.categories ?? []).map((c: string) => CATEGORY_LABELS[c] ?? c).join(', ')}
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Message personnalisé (envoyé par email au candidat)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Expliquez votre décision ou félicitez le candidat..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
                onClick={() => decider(modal.id, true)} disabled={envoi}>
                {envoi ? 'En cours...' : 'Approuver et créer le compte expert'}
              </Button>
              <Button
                variant="destructive" className="flex-1"
                onClick={() => decider(modal.id, false)} disabled={envoi}>
                {envoi ? 'En cours...' : 'Refuser la candidature'}
              </Button>
            </div>
            <button onClick={() => setModal(null)} className="text-sm text-slate-500 hover:text-slate-700 w-full text-center">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
