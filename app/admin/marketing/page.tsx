'use client'

import { useEffect, useState } from 'react'

// Page admin - liste des utilisateurs ayant accepté les emails marketing
export default function AdminMarketingPage() {
  const [users, setUsers]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal]   = useState(0)

  useEffect(() => {
    fetch('/api/admin/marketing')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? [])
        setTotal(data.total ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Télécharge la liste complète au format JSON
  function telecharger() {
    window.open('/api/admin/marketing?export=true', '_blank')
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emails marketing</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '...' : `${total} utilisateur${total > 1 ? 's' : ''} ont accepté de recevoir des emails marketing.`}
          </p>
        </div>
        <button onClick={telecharger}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Télécharger JSON
        </button>
      </div>

      <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
        Cette liste contient uniquement les utilisateurs non bloqués ayant coché "Recevoir des emails marketing" dans leur compte.
        Si un utilisateur décoche cette option, il disparaît automatiquement de cette liste.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <p className="text-slate-500 text-sm py-12 text-center">Aucun utilisateur n'a accepté les emails marketing pour le moment.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Nom</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-800 font-medium">{u.first_name} {u.last_name}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString('fr-BE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
