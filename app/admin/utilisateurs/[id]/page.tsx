'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

// Page admin - profil complet d'un utilisateur client
export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [envoi, setEnvoi]       = useState(false)
  const [modale, setModale]     = useState(false)
  const [raison, setRaison]     = useState('')
  const [erreur, setErreur]     = useState('')
  const [onglet, setOnglet]     = useState<'demandes' | 'finances' | 'info'>('demandes')

  // Champs du formulaire d'édition
  const [form, setForm]         = useState({ first_name: '', last_name: '', email: '', phone: '', marketing_emails: false })
  const [formErreur, setFormErreur] = useState('')
  const [formSucces, setFormSucces] = useState(false)
  const [formEnvoi, setFormEnvoi]   = useState(false)

  useEffect(() => {
    fetch(`/api/admin/utilisateurs/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        if (d.user) {
          setForm({
            first_name:      d.user.first_name ?? '',
            last_name:       d.user.last_name ?? '',
            email:           d.user.email ?? '',
            phone:           d.user.phone ?? '',
            marketing_emails: d.user.marketing_emails ?? false,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  // Sauvegarde les modifications du profil avec trace dans l'audit
  async function sauvegarderInfo() {
    setFormEnvoi(true)
    setFormErreur('')
    setFormSucces(false)
    const res = await fetch(`/api/admin/utilisateurs/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setFormErreur(json.error ?? 'Erreur.'); setFormEnvoi(false); return }
    setData((prev: any) => ({ ...prev, user: { ...prev.user, ...json.user } }))
    setFormSucces(true)
    setFormEnvoi(false)
  }

  // Déblocage immédiat
  async function debloquer() {
    setEnvoi(true)
    await fetch(`/api/admin/utilisateurs/${id}/block`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked: false }),
    })
    setData((prev: any) => ({ ...prev, user: { ...prev.user, is_blocked: false } }))
    setEnvoi(false)
  }

  // Blocage avec raison obligatoire
  async function bloquer() {
    if (!raison.trim()) { setErreur('La raison est obligatoire.'); return }
    setEnvoi(true); setErreur('')
    const res = await fetch(`/api/admin/utilisateurs/${id}/block`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked: true, reason: raison }),
    })
    if (res.ok) {
      setData((prev: any) => ({ ...prev, user: { ...prev.user, is_blocked: true } }))
      setModale(false); setRaison('')
    } else {
      const d = await res.json()
      setErreur(d.error ?? 'Erreur.')
    }
    setEnvoi(false)
  }

  if (loading) return <div className="p-8"><div className="h-48 bg-slate-100 rounded-xl animate-pulse" /></div>
  if (!data)   return <div className="p-8 text-red-600">Utilisateur introuvable.</div>

  const { user, requests, total_depense_cents, total_rembourse_cents } = data

  return (
    <div className="p-8 space-y-6">
      <Link href="/admin/utilisateurs" className="text-sm text-slate-500 hover:text-slate-800">← Retour aux utilisateurs</Link>

      {/* En-tête */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{user.first_name} {user.last_name}</h1>
          <p className="text-sm text-slate-500">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
          <p className="text-xs text-slate-400 mt-1">Inscrit le {new Date(user.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-3">
          {user.is_blocked && <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">Bloqué</span>}
          {user.is_blocked ? (
            <Button size="sm" variant="outline" onClick={debloquer} disabled={envoi}>{envoi ? '...' : 'Débloquer'}</Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={() => setModale(true)}>Bloquer le compte</Button>
          )}
        </div>
      </div>

      {/* Résumé financier */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">Demandes</p>
          <p className="text-2xl font-bold text-slate-800">{requests.length}</p>
        </div>
        <div className="bg-white border border-green-100 rounded-xl p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">Total dépensé</p>
          <p className="text-2xl font-bold text-green-600">{(total_depense_cents / 100).toFixed(2).replace('.', ',')} €</p>
        </div>
        <div className="bg-white border border-blue-100 rounded-xl p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">Total remboursé</p>
          <p className="text-2xl font-bold text-blue-600">{(total_rembourse_cents / 100).toFixed(2).replace('.', ',')} €</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-slate-200">
        {([
          { key: 'demandes', label: `Demandes (${requests.length})` },
          { key: 'finances', label: 'Finances' },
          { key: 'info',     label: 'Informations' },
        ] as const).map((o) => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              onglet === o.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Onglet Demandes */}
      {onglet === 'demandes' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucune demande.</p>
          ) : requests.map((r: any) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {CATEGORY_LABELS[r.category]} · {new Date(r.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {(r.amount_cents / 100).toFixed(2).replace('.', ',')} €
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${
                  r.status === 'answered'  ? 'bg-green-100 text-green-700' :
                  r.status === 'refunded'  ? 'bg-blue-100 text-blue-700'  :
                  r.status === 'contested' ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-600'
                }`}>{STATUT_LABELS[r.status] ?? r.status}</span>
              </div>
              {r.answers?.[0] && (
                <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
                  <span className="font-medium">Réponse :</span> {r.answers[0].experts?.display_name ?? 'Expert'} ·{' '}
                  {r.answers[0].verdict ? `"${r.answers[0].verdict}"` : 'Pas de verdict'} ·{' '}
                  {r.answers[0].is_paid ? <span className="text-green-600">Payé</span>
                    : r.answers[0].is_contested ? <span className="text-orange-600">Contesté</span>
                    : <span className="text-slate-400">En attente paiement</span>}
                </div>
              )}
              <Link href={`/admin/demandes/${r.id}`} className="text-xs text-indigo-600 hover:underline">Voir le dossier →</Link>
            </div>
          ))}
        </div>
      )}

      {/* Onglet Finances */}
      {onglet === 'finances' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="font-medium text-slate-800 text-sm">Résumé financier</h3>
          <div className="space-y-2">
            {requests.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-slate-700 truncate">{r.title}</p>
                  <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {r.status === 'refunded'
                    ? <p className="text-blue-600 font-medium">Remboursé</p>
                    : <p className="text-green-600 font-medium">+{(r.amount_cents / 100).toFixed(2).replace('.', ',')} €</p>
                  }
                </div>
              </div>
            ))}
          </div>
          {requests.length === 0 && <p className="text-slate-500 text-sm">Aucune transaction.</p>}
        </div>
      )}

      {/* Onglet Informations - éditable, toute modification tracée dans l'audit */}
      {onglet === 'info' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-slate-800">Modifier les informations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Prénom</label>
              <input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nom</label>
              <input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Téléphone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Optionnel"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.marketing_emails}
              onChange={(e) => setForm((f) => ({ ...f, marketing_emails: e.target.checked }))}
              className="rounded border-slate-300" />
            <span className="text-sm text-slate-700">Emails marketing acceptés</span>
          </label>
          {formErreur && <p className="text-sm text-red-600">{formErreur}</p>}
          {formSucces && <p className="text-sm text-green-600">Modifications sauvegardées et tracées dans l'audit.</p>}
          <Button onClick={sauvegarderInfo} disabled={formEnvoi}>
            {formEnvoi ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </Button>
        </div>
      )}

      {/* Modale de blocage */}
      {modale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h2 className="font-bold text-slate-900 text-lg">Bloquer ce compte</h2>
            <p className="text-sm text-slate-600">{user.first_name} {user.last_name} - {user.email}</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Raison du blocage <span className="text-red-500">*</span>
              </label>
              <textarea value={raison} onChange={(e) => setRaison(e.target.value)}
                rows={3} placeholder="Ex : comportement abusif, fausse demande, fraude..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
            {erreur && <p className="text-sm text-red-600">{erreur}</p>}
            <div className="flex gap-3">
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={bloquer} disabled={envoi || !raison.trim()}>
                {envoi ? '...' : 'Confirmer le blocage'}
              </Button>
              <Button variant="outline" onClick={() => { setModale(false); setRaison(''); setErreur('') }}>Annuler</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
