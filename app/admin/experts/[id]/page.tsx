'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface ExpertDetail {
  expert: Record<string, any>
  answers: any[]
  signalements: any[]
  suspension_logs: any[]
  payouts: any[]
  charte: { id: string; charter_version: string; signed_at: string; ip_address: string; pdf_url: string | null } | null
  stats: { total_answers: number; total_signalements: number; signalements_refus: number; litige_rate: number }
}

// Page admin - profil complet d'un expert avec historique et actions
export default function AdminExpertDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData]               = useState<ExpertDetail | null>(null)
  const [loading, setLoading]         = useState(true)
  const [onglet, setOnglet]           = useState<'info' | 'activite' | 'suspensions' | 'litiges'>('info')
  const [suspensionRaison, setSuspensionRaison] = useState('')
  const [erreur, setErreur]           = useState('')
  const [envoi, setEnvoi]             = useState(false)

  // Champs du formulaire d'édition expert
  const [form, setForm]               = useState<Record<string, any>>({})
  const [formEnvoi, setFormEnvoi]     = useState(false)
  const [formErreur, setFormErreur]   = useState('')
  const [formSucces, setFormSucces]   = useState(false)

  useEffect(() => {
    fetch(`/api/admin/experts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        if (d.expert) {
          const e = d.expert
          setForm({
            display_name:     e.display_name ?? '',
            first_name:       e.first_name ?? '',
            last_name:        e.last_name ?? '',
            email:            e.email ?? '',
            phone:            e.phone ?? '',
            city:             e.city ?? '',
            years_experience: e.years_experience ?? 0,
            bio:              e.bio ?? '',
            entity_type:      e.entity_type ?? 'individual',
            company_name:     e.company_name ?? '',
            bce_number:       e.bce_number ?? '',
            vat_number:       e.vat_number ?? '',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  // Sauvegarde les modifications du profil expert avec trace dans l'audit
  async function sauvegarderInfo() {
    setFormEnvoi(true); setFormErreur(''); setFormSucces(false)
    const res = await fetch(`/api/admin/experts/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setFormErreur(json.error ?? 'Erreur.'); setFormEnvoi(false); return }
    setData((prev) => prev ? { ...prev, expert: { ...prev.expert, ...json.expert } } : prev)
    setFormSucces(true)
    setFormEnvoi(false)
  }

  async function basculerStatut(activer: boolean) {
    if (!activer && !suspensionRaison.trim()) {
      setErreur('La raison de suspension est obligatoire.')
      return
    }
    setEnvoi(true)
    setErreur('')

    const res  = await fetch(`/api/admin/experts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: activer, suspension_reason: activer ? null : suspensionRaison }),
    })
    const json = await res.json()

    if (!res.ok) { setErreur(json.error || 'Erreur.'); setEnvoi(false); return }

    setData((prev) => prev ? { ...prev, expert: { ...prev.expert, ...json.expert } } : prev)
    setSuspensionRaison('')
    setEnvoi(false)
  }

  if (loading) return <div className="p-8"><div className="h-48 bg-slate-100 rounded-xl animate-pulse" /></div>
  if (!data) return <div className="p-8 text-red-600">Expert introuvable.</div>

  const { expert, stats } = data

  return (
    <div className="p-8 space-y-6">

      {/* Retour */}
      <Link href="/admin/experts" className="text-sm text-slate-500 hover:text-slate-800">← Retour aux experts</Link>

      {/* En-tête */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Photo de profil */}
          {expert.photo_url ? (
            <Image src={expert.photo_url} alt={expert.display_name} width={64} height={64}
              className="w-16 h-16 rounded-full object-cover border border-slate-200 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <span className="text-2xl text-slate-400">{expert.first_name?.[0]?.toUpperCase() ?? '?'}</span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{expert.display_name}</h1>
            <p className="text-sm text-slate-500">{expert.first_name} {expert.last_name} · {expert.email} · {expert.city}</p>
            <p className="text-xs text-slate-400 mt-1">Inscrit le {new Date(expert.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {expert.is_active
            ? <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Actif</span>
            : <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">Suspendu</span>
          }
        </div>
      </div>

      {/* Bandeau suspension */}
      {!expert.is_active && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-red-800">
            Compte suspendu {expert.suspension_type === 'manual' ? 'manuellement' : 'automatiquement'}
          </p>
          {expert.suspension_reason && <p className="text-sm text-red-700">Raison : {expert.suspension_reason}</p>}
          <Button size="sm" onClick={() => basculerStatut(true)} disabled={envoi}
            className="bg-green-600 hover:bg-green-700 text-white">
            Réactiver ce compte
          </Button>
        </div>
      )}

      {/* Suspension manuelle */}
      {expert.is_active && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="font-medium text-slate-800 text-sm">Suspendre ce compte</p>
          <input
            type="text" value={suspensionRaison} onChange={(e) => setSuspensionRaison(e.target.value)}
            placeholder="Raison de la suspension (obligatoire)..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          {erreur && <p className="text-red-500 text-sm">{erreur}</p>}
          <Button size="sm" variant="destructive" onClick={() => basculerStatut(false)} disabled={envoi || !suspensionRaison.trim()}>
            {envoi ? 'En cours...' : 'Confirmer la suspension'}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Réponses',      valeur: stats.total_answers },
          { label: 'Signalements',  valeur: stats.total_signalements },
          { label: 'Refusés',       valeur: stats.signalements_refus },
          { label: 'Taux litige',   valeur: `${stats.litige_rate}%` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-slate-800">{s.valeur}</p>
          </div>
        ))}
      </div>

      {/* Réponses - toujours visible */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-800">
          Réponses <span className="text-slate-400 font-normal text-sm">({data.answers.length})</span>
        </h2>
        {data.answers.length === 0
          ? <p className="text-slate-500 text-sm">Aucune réponse.</p>
          : data.answers.map((a: any) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{a.requests?.title ?? 'Demande supprimée'}</p>
                <p className="text-xs text-slate-400">{new Date(a.delivered_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="text-right text-xs shrink-0 space-y-0.5">
                {a.ratings?.[0] ? <p className="text-yellow-600">★ {a.ratings[0].score}/5</p> : <p className="text-slate-400">Non noté</p>}
                {a.is_paid
                  ? <p className="text-green-600">Payé</p>
                  : a.is_contested && !a.contest_resolved
                  ? <p className="text-orange-600">Contesté</p>
                  : <p className="text-slate-400">En attente</p>
                }
              </div>
            </div>
          ))
        }
      </div>

      {/* Signalements - toujours visible */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-800">
          Signalements <span className="text-slate-400 font-normal text-sm">({data.signalements.length})</span>
        </h2>
        {data.signalements.length === 0
          ? <p className="text-slate-500 text-sm">Aucun signalement.</p>
          : data.signalements.map((s: any) => (
            <div key={s.id} className="bg-white border border-orange-100 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{s.requests?.title ?? '-'}</p>
                <p className="text-xs text-slate-500">Raison : {s.contest_reason ?? '-'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.contest_resolved
                  ? <span className={`text-xs px-2 py-0.5 rounded-full ${s.contest_decision === 'validate' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.contest_decision === 'validate' ? 'Validé' : 'Refusé'}
                    </span>
                  : <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">En attente</span>
                }
                <Link href={`/admin/signalements/${s.id}`} className="text-xs text-indigo-600 hover:underline">
                  Dossier →
                </Link>
              </div>
            </div>
          ))
        }
      </div>

      {/* Onglets - informations de profil, suspensions et litiges */}
      <div className="flex gap-1 border-b border-slate-200">
        {([
          { key: 'info',        label: 'Informations' },
          { key: 'suspensions', label: `Suspensions (${data.suspension_logs.length})` },
          { key: 'litiges',     label: `Litiges (${data.signalements.length})` },
        ] as const).map((o) => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              onglet === o.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Onglet Informations - formulaire éditable, toute modification tracée dans l'audit */}
      {onglet === 'info' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="font-medium text-slate-800">Modifier le profil</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Prénom',        key: 'first_name' },
                { label: 'Nom',           key: 'last_name' },
                { label: 'Pseudo affiché', key: 'display_name' },
                { label: 'Email',         key: 'email' },
                { label: 'Téléphone',     key: 'phone' },
                { label: 'Ville',         key: 'city' },
                { label: 'Années d\'exp.', key: 'years_experience', type: 'number' },
                { label: 'BCE',           key: 'bce_number' },
                { label: 'TVA',           key: 'vat_number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs text-slate-500 mb-1">{label}</label>
                  <input
                    type={type ?? 'text'}
                    value={form[key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Bio</label>
              <textarea value={form.bio ?? ''} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type de compte</label>
              <select value={form.entity_type ?? 'individual'} onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value }))}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="individual">Particulier</option>
                <option value="company">Société</option>
              </select>
            </div>
            {form.entity_type === 'company' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nom de la société</label>
                <input value={form.company_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            )}
            {formErreur && <p className="text-sm text-red-600">{formErreur}</p>}
            {formSucces && <p className="text-sm text-green-600">Modifications sauvegardées et tracées dans l'audit.</p>}
            <Button onClick={sauvegarderInfo} disabled={formEnvoi}>
              {formEnvoi ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </Button>
          </div>

          {/* Documents et charte - lecture seule */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            {expert.justification_url && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Justificatif professionnel</p>
                <a href={expert.justification_url} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline text-sm">Ouvrir le document →</a>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 mb-2">Charte de bonne conduite</p>
              {data.charte ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Signée</span>
                  <span className="text-xs text-slate-500">
                    Version {data.charte.charter_version} · {new Date(data.charte.signed_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {data.charte.ip_address ? ` · IP : ${data.charte.ip_address}` : ''}
                  </span>
                  {data.charte.pdf_url && (
                    <a href={data.charte.pdf_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline border border-indigo-200 px-2 py-1 rounded">
                      Télécharger le PDF →
                    </a>
                  )}
                </div>
              ) : (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Non signée</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onglet Suspensions */}
      {onglet === 'suspensions' && (
        <div className="space-y-3">
          {data.suspension_logs.length === 0
            ? <p className="text-slate-500 text-sm">Aucun historique de suspension.</p>
            : data.suspension_logs.map((log: any) => (
              <div key={log.id} className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {log.action === 'suspended' ? 'Suspendu' : 'Réactivé'} · {log.type ?? '-'}
                  </p>
                  {log.reason && <p className="text-xs text-slate-500 mt-0.5">{log.reason}</p>}
                  <p className="text-xs text-slate-400">{log.created_by === 'system' ? 'Automatique' : 'Admin'}</p>
                </div>
                <p className="text-xs text-slate-400 shrink-0">{new Date(log.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))
          }
        </div>
      )}

      {/* Onglet Litiges */}
      {onglet === 'litiges' && (
        <div className="space-y-3">
          {data.signalements.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucun litige enregistré pour cet expert.</p>
          ) : (
            <>
              {/* Résumé chiffré */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">Total litiges</p>
                  <p className="text-xl font-bold text-slate-800">{stats.total_signalements}</p>
                </div>
                <div className="bg-white border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">Validés (expert ok)</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.signalements.filter((s: any) => s.contest_decision === 'validate').length}
                  </p>
                </div>
                <div className="bg-white border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">Refusés (mauvaise réponse)</p>
                  <p className="text-xl font-bold text-red-600">{stats.signalements_refus}</p>
                </div>
              </div>

              {/* Liste détaillée */}
              {data.signalements.map((s: any) => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.requests?.title ?? '-'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Raison : {s.contest_reason ?? '-'}</p>
                      <p className="text-xs text-slate-400">
                        Signalement le {new Date(s.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {s.contest_resolved && s.admin_decision_at
                          ? ` · Décision le ${new Date(s.admin_decision_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : ''
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.contest_resolved
                        ? <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.contest_decision === 'validate' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.contest_decision === 'validate' ? 'Réponse validée' : 'Client remboursé'}
                          </span>
                        : <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">En attente de décision</span>
                      }
                      <Link href={`/admin/signalements/${s.id}`}
                        className="text-xs text-indigo-600 hover:underline border border-indigo-200 px-2 py-1 rounded">
                        Dossier →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
