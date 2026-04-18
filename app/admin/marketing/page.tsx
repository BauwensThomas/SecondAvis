'use client'

import { useEffect, useState } from 'react'

// Page admin - gestion des contacts marketing (newsletter + comptes)
export default function AdminMarketingPage() {
  const [users, setUsers]           = useState<any[]>([])
  const [newsletter, setNewsletter] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [recherche, setRecherche]   = useState('')
  const [suppression, setSuppression] = useState<string | null>(null)

  // Charge les deux listes au montage
  useEffect(() => {
    charger()
  }, [])

  function charger() {
    setLoading(true)
    fetch('/api/admin/marketing')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? [])
        setNewsletter(data.newsletter ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  // Filtre les deux listes selon la recherche
  const terme = recherche.toLowerCase().trim()
  const usersFiltres       = users.filter((u) => !terme || u.email.toLowerCase().includes(terme) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(terme))
  const newsletterFiltres  = newsletter.filter((n) => !terme || n.email.toLowerCase().includes(terme))
  const total = users.length + newsletter.length

  // Supprime un abonné newsletter ou désinscrit un utilisateur marketing
  async function supprimer(type: 'newsletter' | 'user', id: string) {
    setSuppression(id)
    try {
      await fetch('/api/admin/marketing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      })
      charger()
    } finally {
      setSuppression(null)
    }
  }

  function telecharger() {
    window.open('/api/admin/marketing?export=true', '_blank')
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emails marketing</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '...' : `${total} contact${total > 1 ? 's' : ''} au total.`}
          </p>
        </div>
        <button onClick={telecharger}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Télécharger JSON
        </button>
      </div>

      {/* Barre de recherche */}
      <input
        type="text"
        placeholder="Rechercher par email ou nom..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        className="w-full max-w-sm border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Abonnés newsletter (visiteurs anonymes) */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">
          Abonnés newsletter blog
          <span className="ml-2 text-sm font-normal text-slate-400">({newsletterFiltres.length})</span>
        </h2>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          Visiteurs anonymes inscrits via le formulaire newsletter. La suppression retire définitivement leur email.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : newsletterFiltres.length === 0 ? (
          <p className="text-slate-400 text-sm py-6 text-center">
            {terme ? 'Aucun résultat pour cette recherche.' : 'Aucun abonné newsletter pour le moment.'}
          </p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Inscrit le</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {newsletterFiltres.map((n: any) => (
                  <tr key={n.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-700">{n.email}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {new Date(n.created_at).toLocaleDateString('fr-BE')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => supprimer('newsletter', n.id)}
                        disabled={suppression === n.id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40 transition-colors"
                      >
                        {suppression === n.id ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Utilisateurs inscrits ayant accepté les emails marketing */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-800">
          Utilisateurs avec emails marketing
          <span className="ml-2 text-sm font-normal text-slate-400">({usersFiltres.length})</span>
        </h2>
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          Utilisateurs inscrits ayant coché "Recevoir des emails marketing". La désinscription décoche l'option
          sur leur compte sans le supprimer.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : usersFiltres.length === 0 ? (
          <p className="text-slate-400 text-sm py-6 text-center">
            {terme ? 'Aucun résultat pour cette recherche.' : "Aucun utilisateur n'a accepté les emails marketing pour le moment."}
          </p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Nom</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Inscrit le</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {usersFiltres.map((u: any) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-800 font-medium">{u.first_name} {u.last_name}</td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('fr-BE')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => supprimer('user', u.id)}
                        disabled={suppression === u.id}
                        className="text-xs text-orange-500 hover:text-orange-700 font-medium disabled:opacity-40 transition-colors"
                      >
                        {suppression === u.id ? 'En cours...' : 'Désinscrire'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
