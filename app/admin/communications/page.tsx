'use client'

import { useEffect, useState } from 'react'

interface AdminEmail {
  id: string
  recipient_type: 'client' | 'expert'
  recipient_id: string
  recipient_email: string
  related_type: string | null
  related_id: string | null
  subject: string
  body: string
  sent_at: string
}

const RELATED_TYPE_LABELS: Record<string, string> = {
  signalement:  'Signalement',
  candidature:  'Candidature',
  autre:        'Autre',
}

// Page admin - historique complet de tous les emails envoyés manuellement
export default function AdminCommunicationsPage() {
  const [emails, setEmails]     = useState<AdminEmail[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [type, setType]         = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q)          params.set('q', q)
    if (type !== 'all') params.set('type', type)

    fetch(`/api/admin/communications?${params}`)
      .then((r) => r.json())
      .then((data) => { setEmails(data.emails ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [q, type])

  return (
    <div className="p-8 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
        <p className="text-slate-500 text-sm mt-1">Tous les emails envoyés manuellement depuis l'admin.</p>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher par email..."
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <div className="flex gap-1">
          {([
            { val: 'all',    label: 'Tous' },
            { val: 'client', label: 'Clients' },
            { val: 'expert', label: 'Experts' },
          ] as const).map((opt) => (
            <button
              key={opt.val}
              onClick={() => setType(opt.val)}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                type === opt.val
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400 self-center">{emails.length} email{emails.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Liste */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && emails.length === 0 && (
        <p className="text-slate-500 text-sm">Aucun email envoyé pour le moment.</p>
      )}

      {!loading && emails.length > 0 && (
        <div className="space-y-3">
          {emails.map((email) => (
            <div key={email.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">

              {/* En-tête de l'email */}
              <button
                onClick={() => setExpanded(expanded === email.id ? null : email.id)}
                className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Badge type destinataire */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${
                    email.recipient_type === 'expert'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {email.recipient_type === 'expert' ? 'Expert' : 'Client'}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{email.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      À : <span className="font-medium">{email.recipient_email}</span>
                      {email.related_type && (
                        <span className="ml-2 text-slate-400">
                          · {RELATED_TYPE_LABELS[email.related_type] ?? email.related_type}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs text-slate-400">
                    {new Date(email.sent_at).toLocaleString('fr-BE', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <span className="text-slate-300 text-sm">{expanded === email.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Contenu de l'email - déplié au clic */}
              {expanded === email.id && (
                <div className="px-5 pb-5 border-t border-slate-100">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap mt-4 leading-relaxed">{email.body}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
