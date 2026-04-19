import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { render } from '@react-email/components'
import Refunded from '@/emails/Refunded'
import ExpertPaymentSent from '@/emails/ExpertPaymentSent'

// POST - appelé toutes les heures par Vercel Cron
// Gère 3 choses : demandes expirées, paiements experts, nettoyage des paiements non confirmés
export async function POST(request: NextRequest) {
  // Vérifie le token de sécurité pour bloquer les appels non autorisés
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const supabaseAdmin = createAdminClient()
  let refunded_count = 0
  let paid_count = 0
  let cleaned_count = 0

  // ---- Partie A : Remboursements pour demandes expirées sans réponse ----

  const { data: expired } = await supabaseAdmin
    .from('requests')
    .select('id, title, stripe_payment_intent_id, amount_cents, users(email, first_name)')
    .eq('status', 'pending')
    .eq('payment_confirmed', true)
    .lt('expires_at', new Date().toISOString())

  for (const req of expired ?? []) {
    try {
      // Fonction PostgreSQL atomique avec SELECT FOR UPDATE - zéro race condition possible
      // Si un expert répond pendant ce temps, la transaction est bloquée jusqu'à la fin
      const { data: paymentIntent } = await supabaseAdmin.rpc('refund_expired_request', {
        p_request_id: req.id,
      })

      if (paymentIntent === 'skipped') {
        // Un expert a répondu juste avant - on ne rembourse pas
        continue
      }

      if (paymentIntent) {
        await stripe.refunds.create({ payment_intent: paymentIntent })
      }

      // Notifie le client du remboursement
      const client = req.users as unknown as { email: string; first_name: string } | null
      if (client?.email) {
        const montant = ((req.amount_cents ?? 900) / 100).toFixed(2).replace('.', ',') + ' €'
        const html = await render(Refunded({ prenomClient: client.first_name, titreQuestion: req.title, montant }))
        await resend.emails.send({ from: EMAIL_FROM, to: client.email, subject: 'Votre remboursement est en cours - Avisbox', html })
      }

      refunded_count++
    } catch (err) {
      console.error('Erreur remboursement demande expirée:', req.id, err)
    }
  }

  // ---- Partie B : Paiements experts après 5 jours sans signalement ----

  const now = new Date().toISOString()
  const { data: eligibleAnswers } = await supabaseAdmin
    .from('answers')
    .select('id, expert_id, experts(stripe_account_id, email, first_name), requests(title)')
    .eq('is_paid', false)
    .eq('is_contested', false)
    .lt('contest_window_ends', now)
    .lt('payment_eligible_at', now)

  const expertPaymentCents = Number(process.env.NEXT_PUBLIC_EXPERT_PAYMENT_CENTS) || 1000

  for (const answer of eligibleAnswers ?? []) {
    try {
      const expert = answer.experts as unknown as { stripe_account_id: string | null; email: string; first_name: string } | null
      const req    = answer.requests as unknown as { title: string } | null

      // Si l'expert n'a pas encore connecté son compte Stripe, on laisse en attente
      // Le prochain passage du cron réessaiera automatiquement dès que le compte sera connecté
      if (!expert?.stripe_account_id) {
        console.warn(`Expert sans compte Stripe - réponse ${answer.id} ignorée, sera retraitée au prochain passage.`)
        continue
      }

      // Effectue le virement vers le compte Stripe de l'expert
      await stripe.transfers.create({
        amount: expertPaymentCents,
        currency: 'eur',
        destination: expert.stripe_account_id,
      })

      // Marque le paiement comme effectué seulement si le virement a réussi
      await supabaseAdmin
        .from('answers')
        .update({ is_paid: true })
        .eq('id', answer.id)

      await supabaseAdmin
        .from('payouts')
        .insert({ expert_id: answer.expert_id, amount_cents: expertPaymentCents, status: 'paid', answer_id: answer.id })

      // Notifie l'expert que son paiement a été effectué
      const montant = (expertPaymentCents / 100).toFixed(2).replace('.', ',') + ' €'
      const html = await render(ExpertPaymentSent({ prenomExpert: expert.first_name, titreQuestion: req?.title ?? 'Votre réponse', montant }))
      await resend.emails.send({ from: EMAIL_FROM, to: expert.email, subject: 'Votre paiement a été effectué - Avisbox', html })

      paid_count++
    } catch (err) {
      console.error('Erreur paiement expert:', answer.id, err)
    }
  }

  // ---- Partie C : Nettoyage des demandes avec paiement non confirmé depuis plus de 5 minutes ----
  // L'utilisateur a 5 minutes pour finaliser son paiement, ensuite la demande est supprimée

  const cinqMinutesAvant = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data: abandoned } = await supabaseAdmin
    .from('requests')
    .select('id')
    .eq('payment_confirmed', false)
    .lt('created_at', cinqMinutesAvant)

  if (abandoned && abandoned.length > 0) {
    const ids = abandoned.map((r) => r.id)
    await supabaseAdmin.from('requests').delete().in('id', ids)
    cleaned_count = ids.length
  }

  return NextResponse.json({ refunded_count, paid_count, cleaned_count })
}
