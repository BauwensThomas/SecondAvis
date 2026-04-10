'use client'

import { useEffect, useState, useCallback } from 'react'

const ACTION_LABELS: Record<string, string> = {
  update_user_email:     'Email client modifié',
  update_user_profile:   'Profil client modifié',
  block_user:            'Client bloqué',
  unblock_user:          'Client débloqué',
  delete_user:           'Compte client supprimé',
  update_expert:         'Profil expert modifié',
  update_expert_profile: 'Profil expert modifié',
  suspend_expert:        'Expert suspendu',
  reactivate_expert:     'Expert réactivé',
  delete_expert:         'Compte expert supprimé',
  refund:                'Remboursement effectué',
  arbitrate_validate:    'Signalement : réponse validée',
  arbitrate_refund:      'Signalement : client remboursé',
  approve_candidature:   'Candidature approuvée',
  reject_candidature:    'Candidature refusée',
  gdpr_erasure:          'Effacement RGPD',
  erasure_account:       'Effacement RGPD',
}

// Page admin - journal de toutes les actions admin (audit log RGPD)
export default function AdminAuditPage() {
  const [logs, setLogs]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(0)
  const [hasMore, setHasMore]   = useState(true)
  const [action, setAction]     = useState('')
  const [target, setTarget]     = useState('')
  const [email, setEmail]       = useState('')
  const LIMIT = 50

  const charger = useCallback((reset = false) => {
    setLoading(true)
    const offset = reset ? 0 : page * LIMIT
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset), action, target })
    if (email.trim()) params.set('email', email.trim())
    fetch(`/api/admin/audit?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const items = data.logs ?? []
        setLogs((prev) => reset ? items : [...prev, ...items])
        setHasMore(items.length === LIMIT)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, action, target])

  // Recharge depuis le début si les filtres changent
  useEffect(() => {
    setPage(0)
    setLogs([])
    charger(true)
  }, [action, target, email]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page > 0) charger()
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Journal d'audit</h1>
        <p className="text-sm text-slate-500 mt-1">Toutes les actions admin (obligatoire RGPD)</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Rechercher par email..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64"
        />
        <select value={action} onChange={(e) => setAction(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes les actions</option>
          {Object.entries(ACTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={target} onChange={(e) => setTarget(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Tous les types</option>
          <option value="user">Clients</option>
          <option value="expert">Experts</option>
          <option value="request">Demandes</option>
          <option value="answer">Réponses</option>
        </select>
      </div>

      {/* Liste des logs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="space-y-0">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-14 bg-slate-50 border-b border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-slate-500 text-sm p-6">Aucune action enregistrée.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Cible</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Raison</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString('fr-BE')}{' '}
                      {new Date(log.created_at).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-slate-800 font-medium">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">{log.target_type}</span>
                      {' '}
                      {log.target_label
                        ? <span className="text-slate-700">{log.target_label}</span>
                        : <span className="text-slate-400 font-mono">{String(log.target_id).slice(0, 8)}…</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs max-w-64 truncate">{log.reason ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasMore && (
              <div className="p-4 text-center border-t border-slate-100">
                <button onClick={() => setPage((p) => p + 1)} disabled={loading}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  {loading ? 'Chargement...' : 'Voir plus'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
