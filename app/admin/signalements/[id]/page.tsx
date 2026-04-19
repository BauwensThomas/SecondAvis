'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const RAISON_LABELS: Record<string, string> = {
  vague: 'Réponse vague ou inutile',
  incorrecte: 'Informations incorrectes ou douteuses',
  solicitation: 'Solicitation commerciale inappropriée',
  abusif: 'Contenu offensant ou abusif',
  autre: 'Autre raison',
}

// Page admin - traitement complet d'un signalement (la page la plus importante de l'espace admin)
export default function AdminSignalementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [envoi, setEnvoi]       = useState(false)
  const [decision, setDecision] = useState<'validate' | 'refund' | null>(null)

  // Etats pour l'envoi d'emails manuels
  const [emailClient, setEmailClient]   = useState('')
  const [emailExpert, setEmailExpert]   = useState('')
  const [envoiEmailC, setEnvoiEmailC]   = useState(false)
  const [envoiEmailE, setEnvoiEmailE]   = useState(false)
  const [emailHistory, setEmailHistory] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/admin/signalements/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setEmailHistory(d.email_history ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  // Envoie la décision finale d'arbitrage
  async function arbitrer(dec: 'validate' | 'refund') {
    if (!confirm(dec === 'validate'
      ? 'Valider la réponse de l\'expert ? Il sera payé dans 5 jours.'
      : 'Rembourser le client ? L\'expert ne sera pas payé.'
    )) return
    setEnvoi(true)
    setDecision(dec)
    const res = await fetch(`/api/admin/signalements/${id}/arbitrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: dec }),
    })
    const json = await res.json()
    if (res.ok) {
      setData((prev: any) => ({
        ...prev,
        answer: { ...prev.answer, contest_resolved: true, contest_decision: dec },
      }))
    } else {
      alert(json.error || 'Erreur lors de l\'arbitrage.')
    }
    setEnvoi(false)
  }

  // Envoie un email manuel au client et l'ajoute à l'historique local
  async function envoyerEmailClient() {
    if (!emailClient.trim()) return
    setEnvoiEmailC(true)
    const message = emailClient
    await fetch('/api/admin/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_type: 'client',
        recipient_id: data.user.id,
        related_type: 'signalement',
        related_id: id,
        subject: 'Concernant votre signalement - Avisbox',
        body: message,
      }),
    })
    setEmailHistory((prev) => [{
      recipient_type: 'client',
      body: message,
      subject: 'Concernant votre signalement - Avisbox',
      sent_at: new Date().toISOString(),
    }, ...prev])
    setEmailClient('')
    setEnvoiEmailC(false)
  }

  // Envoie un email manuel à l'expert et l'ajoute à l'historique local
  async function envoyerEmailExpert() {
    if (!emailExpert.trim()) return
    setEnvoiEmailE(true)
    const message = emailExpert
    await fetch('/api/admin/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_type: 'expert',
        recipient_id: data.expert.id,
        related_type: 'signalement',
        related_id: id,
        subject: 'Concernant votre réponse - Avisbox',
        body: message,
      }),
    })
    setEmailHistory((prev) => [{
      recipient_type: 'expert',
      body: message,
      subject: 'Concernant votre réponse - Avisbox',
      sent_at: new Date().toISOString(),
    }, ...prev])
    setEmailExpert('')
    setEnvoiEmailE(false)
  }

  if (loading) return <div className="p-8"><div className="h-48 bg-slate-100 rounded-xl animate-pulse" /></div>
  if (!data) return <div className="p-8 text-red-600">Signalement introuvable.</div>

  const { request, answer, expert, user } = data
  const resolu = answer?.contest_resolved

  return (
    <div className="p-8 space-y-6">
      <Link href="/admin/signalements" className="text-sm text-slate-500 hover:text-slate-800">← Retour aux signalements</Link>

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-900">Signalement - {request?.title}</h1>
        {resolu
          ? <span className={`text-sm px-3 py-1 rounded-full font-medium ${
              answer.contest_decision === 'validate' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {answer.contest_decision === 'validate' ? 'Réponse validée' : 'Client remboursé'}
            </span>
          : <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">En attente d'arbitrage</span>
        }
      </div>

      {/* BLOC 1 - Demande originale */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-slate-800">Demande originale du client</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Client</p>
            <p className="font-medium text-slate-800">{user?.first_name} {user?.last_name}</p>
            <p className="text-slate-500 text-xs">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Catégorie · Montant</p>
            <p className="font-medium text-slate-800">{request?.category} · {((request?.amount_cents ?? 0) / 100).toFixed(2)} €</p>
            <p className="text-slate-500 text-xs">
              {new Date(request?.created_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Description</p>
          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{request?.description}</p>
        </div>
        {request?.attachments?.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Fichiers joints</p>
            <div className="flex gap-2 flex-wrap">
              {request.attachments.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline border border-indigo-200 px-2 py-1 rounded">
                  Fichier {i + 1} →
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BLOC 2 - Réponse de l'expert */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-slate-800">Réponse de l'expert</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400">Expert</p>
            <p className="font-medium text-slate-800">{expert?.display_name}</p>
            <p className="text-slate-500 text-xs">★ {expert?.average_rating?.toFixed(1)} · {expert?.total_answers} réponses</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Date de réponse</p>
            <p className="font-medium text-slate-800">
              {answer?.delivered_at ? new Date(answer.delivered_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
            </p>
          </div>
        </div>
        {answer?.verdict && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-600 mb-0.5">Verdict</p>
            <p className="font-semibold text-amber-900">{answer.verdict}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-slate-400 mb-1">Contenu de la réponse</p>
          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{answer?.content}</p>
        </div>
      </div>

      {/* BLOC 3 - Détails du signalement */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 space-y-2">
        <h2 className="font-semibold text-orange-900">Détails du signalement</h2>
        <p className="text-sm text-orange-800">
          <span className="font-medium">Raison :</span> {RAISON_LABELS[answer?.contest_reason] ?? answer?.contest_reason ?? '-'}
        </p>
        <p className="text-sm text-orange-800">
          <span className="font-medium">Date :</span>{' '}
          {answer?.created_at ? new Date(answer.created_at).toLocaleString('fr-BE', { dateStyle: 'full', timeStyle: 'short' }) : '-'}
        </p>
        {!resolu && (
          <p className="text-xs text-orange-600 mt-1">
            Tout paiement est gelé jusqu'à votre décision. Le paiement ou remboursement partira 5 jours après votre décision.
          </p>
        )}
      </div>

      {/* BLOC 4 - Email au client */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-slate-800">Email au client</h2>
        <p className="text-xs text-slate-500">Le client ne voit pas ce que vous envoyez à l'expert.</p>
        <textarea
          value={emailClient}
          onChange={(e) => setEmailClient(e.target.value)}
          placeholder="Votre message au client..."
          rows={4}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
        />
        <Button size="sm" onClick={envoyerEmailClient} disabled={envoiEmailC || !emailClient.trim()}>
          {envoiEmailC ? 'Envoi...' : 'Envoyer au client'}
        </Button>
        {/* Historique emails au client */}
        {emailHistory.filter((e) => e.recipient_type === 'client').length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {emailHistory.filter((e) => e.recipient_type === 'client').map((e: any, i: number) => (
              <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
                <p className="font-medium text-slate-500 mb-1">
                  Envoyé le {new Date(e.sent_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="whitespace-pre-wrap">{e.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BLOC 5 - Email à l'expert */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-slate-800">Email à l'expert</h2>
        <p className="text-xs text-slate-500">L'expert ne voit pas ce que vous envoyez au client.</p>
        <textarea
          value={emailExpert}
          onChange={(e) => setEmailExpert(e.target.value)}
          placeholder="Votre message à l'expert..."
          rows={4}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
        />
        <Button size="sm" onClick={envoyerEmailExpert} disabled={envoiEmailE || !emailExpert.trim()}>
          {envoiEmailE ? 'Envoi...' : 'Envoyer à l\'expert'}
        </Button>
        {/* Historique emails à l'expert */}
        {emailHistory.filter((e) => e.recipient_type === 'expert').length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {emailHistory.filter((e) => e.recipient_type === 'expert').map((e: any, i: number) => (
              <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
                <p className="font-medium text-slate-500 mb-1">
                  Envoyé le {new Date(e.sent_at).toLocaleString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="whitespace-pre-wrap">{e.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BLOC 6 - Décision finale */}
      {!resolu ? (
        <div className="bg-white border-2 border-slate-300 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-slate-900 text-lg">Décision finale</h2>
          <p className="text-sm text-slate-600">
            Votre décision est définitive. Le paiement ou remboursement sera exécuté 5 jours après votre choix.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => arbitrer('validate')}
              disabled={envoi}
              className="bg-green-600 hover:bg-green-700 text-white px-6">
              {envoi && decision === 'validate' ? 'En cours...' : 'Valider la réponse de l\'expert'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => arbitrer('refund')}
              disabled={envoi}
              className="px-6">
              {envoi && decision === 'refund' ? 'En cours...' : 'Rembourser le client'}
            </Button>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <p>Valider → L'expert est payé (10 €) dans 5 jours · Son compte redevient actif</p>
            <p>Rembourser → Le client récupère 14,99 € dans 5 jours · L'expert reste suspendu</p>
          </div>
        </div>
      ) : (
        <div className={`rounded-xl p-5 space-y-1 ${
          answer.contest_decision === 'validate' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`font-semibold text-lg ${
            answer.contest_decision === 'validate' ? 'text-green-800' : 'text-blue-800'
          }`}>
            {answer.contest_decision === 'validate' ? 'Réponse validée' : 'Remboursement planifié'}
          </p>
          {answer.admin_decision_at && (
            <p className={`text-sm ${answer.contest_decision === 'validate' ? 'text-green-700' : 'text-blue-700'}`}>
              Décision prise le{' '}
              {new Date(answer.admin_decision_at).toLocaleString('fr-BE', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
          {answer.contest_decision === 'validate' && answer.payment_eligible_at && (
            <p className="text-sm text-green-700">
              Virement à l'expert prévu le{' '}
              {new Date(answer.payment_eligible_at).toLocaleString('fr-BE', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
          {answer.contest_decision === 'refund' && answer.admin_decision_at && (
            <p className="text-sm text-blue-700">
              Remboursement de 14,99 € prévu le{' '}
              {new Date(new Date(answer.admin_decision_at).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleString('fr-BE', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
