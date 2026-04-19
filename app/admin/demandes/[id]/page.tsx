'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const STATUT_LABELS: Record<string, { label: string; classes: string }> = {
  pending:   { label: 'En attente',  classes: 'bg-slate-100 text-slate-600'   },
  answered:  { label: 'Répondu',     classes: 'bg-green-100 text-green-700'   },
  contested: { label: 'Contesté',    classes: 'bg-orange-100 text-orange-700' },
  refunded:  { label: 'Remboursé',   classes: 'bg-blue-100 text-blue-700'     },
  closed:    { label: 'Terminé',     classes: 'bg-slate-100 text-slate-500'   },
}

const CATEGORY_LABELS: Record<string, string> = {
  mecanique: 'Mécanique', immo: 'Immobilier', travaux: 'Travaux',
  assurance: 'Assurance', travail: 'Droit travail', comptabilite: 'Comptabilité',
}

// Page admin - détail complet d'une demande
export default function AdminDemandeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [remb, setRemb]       = useState(false)

  useEffect(() => {
    fetch(`/api/admin/demandes/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  // Remboursement manuel
  async function rembourser() {
    if (!confirm('Rembourser manuellement cette demande ?')) return
    setRemb(true)
    const res = await fetch(`/api/admin/demandes/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Remboursement manuel admin' }),
    })
    if (res.ok) {
      setData((prev: any) => ({ ...prev, request: { ...prev.request, status: 'refunded' } }))
    } else {
      alert('Erreur lors du remboursement.')
    }
    setRemb(false)
  }

  if (loading) {
    return <div className="p-8 space-y-4">{[1,2,3].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}</div>
  }

  if (!data?.request) {
    return <div className="p-8 text-slate-500">Demande introuvable.</div>
  }

  const { request, answer, rating } = data
  const statut = STATUT_LABELS[request.status] ?? { label: request.status, classes: 'bg-slate-100 text-slate-600' }
  const euros  = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' €'

  return (
    <div className="p-8 space-y-6 max-w-3xl">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin/demandes" className="text-sm text-slate-400 hover:text-slate-600">← Retour aux demandes</Link>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{request.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {CATEGORY_LABELS[request.category] ?? request.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statut.classes}`}>
              {statut.label}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(request.created_at).toLocaleString('fr-BE', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
        </div>
        <span className="text-lg font-bold text-green-700 shrink-0">{euros(request.amount_cents)}</span>
      </div>

      {/* Informations client */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
        <h2 className="font-semibold text-slate-800 mb-2">Client</h2>
        <p className="text-sm text-slate-700">
          {request.users?.first_name} {request.users?.last_name}
        </p>
        <p className="text-sm text-slate-500">{request.users?.email}</p>
        {request.users?.phone && <p className="text-sm text-slate-500">{request.users.phone}</p>}
        <Link href={`/admin/utilisateurs/${request.users?.id}`}
          className="text-xs text-indigo-600 hover:underline">
          Voir le profil complet →
        </Link>
      </div>

      {/* Demande originale */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">Demande</h2>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{request.description}</p>
        {request.attachments?.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Fichiers joints</p>
            <div className="flex flex-wrap gap-2">
              {request.attachments.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-600 underline hover:text-indigo-800">
                  Fichier {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
          <span>Expiration : {request.expires_at
            ? new Date(request.expires_at).toLocaleString('fr-BE', { dateStyle: 'medium', timeStyle: 'short' })
            : '-'}
          </span>
          <span>Stripe PI : <code className="font-mono text-xs">{request.stripe_payment_intent_id ?? '-'}</code></span>
        </div>
        {/* Raison du remboursement admin - visible uniquement si la demande a été remboursée manuellement */}
        {request.status === 'refunded' && request.refund_reason && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-xs text-blue-500 mb-0.5">Raison du remboursement</p>
            <p className="text-sm text-blue-900">{request.refund_reason}</p>
          </div>
        )}
      </div>

      {/* Réponse de l'expert */}
      {answer ? (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-semibold text-slate-800">Réponse de l'expert</h2>
            <Link href={`/admin/experts/${answer.experts?.id}`}
              className="text-xs text-indigo-600 hover:underline shrink-0">
              {answer.experts?.display_name} →
            </Link>
          </div>
          {answer.verdict && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
              <p className="text-xs text-indigo-500 mb-0.5">Verdict</p>
              <p className="text-sm font-medium text-indigo-900">{answer.verdict}</p>
            </div>
          )}
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{answer.content}</p>
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <span>Livré le : {answer.delivered_at
              ? new Date(answer.delivered_at).toLocaleString('fr-BE', { dateStyle: 'medium', timeStyle: 'short' })
              : '-'}
            </span>
            <span>Paiement expert : {answer.is_paid
              ? <span className="text-green-600 font-medium">Versé</span>
              : answer.is_contested && answer.contest_resolved && answer.contest_decision === 'validate'
              ? <span className="text-blue-600 font-medium">Approuvé - virement planifié</span>
              : answer.is_contested && answer.contest_resolved && answer.contest_decision === 'refund'
              ? <span className="text-red-600 font-medium">Refusé - non payé</span>
              : answer.is_contested && !answer.contest_resolved
              ? <><span className="line-through text-slate-400">Gelé</span> <span className="text-orange-600">En attente décision</span></>
              : <span className="text-slate-500">En attente</span>}
            </span>
            <span>Contestable jusqu'au : {answer.contest_window_ends
              ? new Date(answer.contest_window_ends).toLocaleString('fr-BE', { dateStyle: 'short', timeStyle: 'short' })
              : '-'}
            </span>
            <span>Éligible paiement : {answer.payment_eligible_at
              ? new Date(answer.payment_eligible_at).toLocaleString('fr-BE', { dateStyle: 'short', timeStyle: 'short' })
              : '-'}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-400">
          Aucune réponse pour l'instant.
        </div>
      )}

      {/* Signalement (si contesté) */}
      {answer?.is_contested && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-2">
          <h2 className="font-semibold text-orange-900">Signalement</h2>
          <p className="text-sm text-orange-800">Raison : {answer.contest_reason ?? '-'}</p>
          <p className="text-sm text-orange-700">
            Résolu : {answer.contest_resolved ? `Oui - décision : ${answer.contest_decision}` : 'Non - en attente'}
          </p>
          <Link href={`/admin/signalements`}
            className="text-sm text-orange-700 underline hover:text-orange-900">
            Voir dans les signalements →
          </Link>
        </div>
      )}

      {/* Note du client */}
      {rating && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1">
          <h2 className="font-semibold text-slate-800 mb-2">Note client</h2>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <span key={s} className={s <= rating.score ? 'text-yellow-400' : 'text-slate-200'}>★</span>
              ))}
            </div>
            <span className="text-sm text-slate-600">{rating.score}/5</span>
          </div>
          {rating.comment && <p className="text-sm text-slate-600 italic">"{rating.comment}"</p>}
          <p className="text-xs text-slate-400">
            Noté le {new Date(rating.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Actions */}
      {['pending', 'answered'].includes(request.status) && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={rembourser} disabled={remb}
            className="border-red-200 text-red-600 hover:bg-red-50">
            {remb ? 'Remboursement...' : 'Rembourser manuellement'}
          </Button>
        </div>
      )}
    </div>
  )
}
