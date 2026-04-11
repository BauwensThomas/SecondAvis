import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { resend } from '@/lib/resend'
import ContestResolvedValidateClient from '@/emails/ContestResolvedValidateClient'
import ContestResolvedValidateExpert from '@/emails/ContestResolvedValidateExpert'
import ContestResolvedRefundClient from '@/emails/ContestResolvedRefundClient'
import ContestResolvedRefundExpert from '@/emails/ContestResolvedRefundExpert'
import React from 'react'

// POST /api/admin/signalements/[id]/arbitrate - décision admin sur un signalement
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { decision } = await request.json()
    if (decision !== 'validate' && decision !== 'refund') {
      return NextResponse.json({ error: 'Décision invalide.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Charge le signalement avec toutes les infos nécessaires
    const { data: answer } = await supabaseAdmin
      .from('answers')
      .select('*, requests(*, users(email, first_name, last_name)), experts(email, display_name)')
      .eq('id', id)
      .single()

    if (!answer) return NextResponse.json({ error: 'Signalement introuvable.' }, { status: 404 })
    if (answer.contest_resolved) return NextResponse.json({ error: 'Ce signalement est déjà résolu.' }, { status: 400 })

    const now = new Date()
    const cinqJours = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()

    if (decision === 'validate') {
      // L'expert avait raison - paiement dans 5 jours
      await supabaseAdmin.from('answers').update({
        contest_resolved:    true,
        contest_decision:    'validate',
        admin_decision_at:   now.toISOString(),
        payment_eligible_at: cinqJours,
      }).eq('id', id)

      await supabaseAdmin.from('requests').update({ status: 'answered' }).eq('id', answer.request_id)

      // Réactive l'expert
      await supabaseAdmin.from('experts').update({ is_active: true }).eq('id', answer.expert_id)

      const clientEmail  = answer.requests?.users?.email
      const clientPrenom = answer.requests?.users?.first_name ?? ''
      const expertEmail  = answer.experts?.email
      const expertPrenom = answer.experts?.display_name ?? ''
      const titreQuestion = answer.requests?.title ?? ''

      if (clientEmail) await resend.emails.send({
        from: process.env.EMAIL_FROM!, to: clientEmail,
        subject: 'Résultat de votre signalement - SecondAvis',
        react: React.createElement(ContestResolvedValidateClient, { prenomClient: clientPrenom, titreQuestion }),
      })

      if (expertEmail) await resend.emails.send({
        from: process.env.EMAIL_FROM!, to: expertEmail,
        subject: 'Votre réponse a été validée - SecondAvis',
        react: React.createElement(ContestResolvedValidateExpert, { prenomExpert: expertPrenom, titreQuestion, montant: '2,00 €' }),
      })

    } else {
      // Le client avait raison - remboursement dans 5 jours
      await supabaseAdmin.from('answers').update({
        contest_resolved:  true,
        contest_decision:  'refund',
        admin_decision_at: now.toISOString(),
      }).eq('id', id)

      await supabaseAdmin.from('requests').update({ status: 'refunded' }).eq('id', answer.request_id)

      // Baisse le score de fiabilité + retire 1 étoile (minimum 0) + décrémente total_answers
      await supabaseAdmin.rpc('increment_expert_signals', { expert_id: answer.expert_id })

      const { data: expertData } = await supabaseAdmin
        .from('experts')
        .select('average_rating, total_answers')
        .eq('id', answer.expert_id)
        .single()

      if (expertData) {
        const nouvelleNote = Math.max(0, (expertData.average_rating ?? 0) - 1)
        const nouveauTotal = Math.max(0, (expertData.total_answers ?? 0) - 1)
        await supabaseAdmin
          .from('experts')
          .update({ average_rating: nouvelleNote, total_answers: nouveauTotal })
          .eq('id', answer.expert_id)
      }

      // Déclenche le remboursement Stripe
      if (answer.requests?.stripe_payment_intent_id) {
        await stripe.refunds.create({ payment_intent: answer.requests.stripe_payment_intent_id })
      }

      const clientEmail   = answer.requests?.users?.email
      const clientPrenom  = answer.requests?.users?.first_name ?? ''
      const expertEmail   = answer.experts?.email
      const expertPrenom  = answer.experts?.display_name ?? ''
      const titreQuestion = answer.requests?.title ?? ''

      if (clientEmail) await resend.emails.send({
        from: process.env.EMAIL_FROM!, to: clientEmail,
        subject: 'Votre signalement a été retenu - SecondAvis',
        react: React.createElement(ContestResolvedRefundClient, { prenomClient: clientPrenom, titreQuestion, montant: '9,00 €' }),
      })

      if (expertEmail) await resend.emails.send({
        from: process.env.EMAIL_FROM!, to: expertEmail,
        subject: 'Résultat de votre signalement - SecondAvis',
        react: React.createElement(ContestResolvedRefundExpert, { prenomExpert: expertPrenom, titreQuestion }),
      })
    }

    // Trace la décision dans l'audit
    await supabaseAdmin.from('audit_logs').insert({
      admin_id:    user.id,
      action:      decision === 'validate' ? 'arbitrate_validate' : 'arbitrate_refund',
      target_type: 'answer',
      target_id:   id,
      new_value:   {
        decision,
        expert_id:  answer.expert_id,
        request_id: answer.request_id,
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur POST /api/admin/signalements/[id]/arbitrate:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
