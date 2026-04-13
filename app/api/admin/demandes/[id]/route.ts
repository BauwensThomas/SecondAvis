import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import Stripe from 'stripe'

const resend = new Resend(process.env.RESEND_API_KEY!)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' as any })

// GET /api/admin/demandes/[id] - détail complet d'une demande (admin)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère la demande avec le client associé
    const { data: request, error } = await supabaseAdmin
      .from('requests')
      .select('*, users(id, first_name, last_name, email, phone)')
      .eq('id', id)
      .single()

    if (error || !request) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }

    // Récupère la réponse si elle existe, avec l'expert
    const { data: answer } = await supabaseAdmin
      .from('answers')
      .select('*, experts(id, display_name, email, average_rating, total_answers)')
      .eq('request_id', id)
      .maybeSingle()

    // Récupère la note si elle existe
    const { data: rating } = answer?.id
      ? await supabaseAdmin.from('ratings').select('score, comment, created_at').eq('answer_id', answer.id).maybeSingle()
      : { data: null }

    return NextResponse.json({ request, answer: answer ?? null, rating: rating ?? null })

  } catch (error) {
    console.error('Erreur GET /api/admin/demandes/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// DELETE /api/admin/demandes/[id] - supprime une demande, email client + remboursement optionnel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const { id }            = await params
    const body              = await request.json()
    const raison: string    = body.raison?.trim() ?? ''
    const doRefund: boolean = body.rembourser === true

    if (!raison) {
      return NextResponse.json({ error: 'La raison est obligatoire.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Recupere la demande avec les infos du client
    const { data: demande, error: errFetch } = await supabaseAdmin
      .from('requests')
      .select('id, title, status, stripe_payment_intent_id, payment_confirmed, amount_cents, users(first_name, last_name, email)')
      .eq('id', id)
      .single()

    if (errFetch || !demande) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }

    // Remboursement Stripe si l'admin l'a demande et que la demande est eligible
    let rembourseEffectue = false
    if (
      doRefund &&
      demande.payment_confirmed &&
      demande.stripe_payment_intent_id &&
      demande.status !== 'refunded'
    ) {
      await stripe.refunds.create({ payment_intent: demande.stripe_payment_intent_id })
      rembourseEffectue = true
    }

    // Marque la demande comme fermee avec la raison dans refund_reason
    const nouveauStatut = rembourseEffectue ? 'refunded' : 'closed'
    await supabaseAdmin
      .from('requests')
      .update({ status: nouveauStatut, refund_reason: `[SUPPRESSION ADMIN] ${raison}` })
      .eq('id', id)

    // Trace la suppression dans l'audit log
    await supabaseAdmin.from('audit_logs').insert({
      action: 'admin_delete_request',
      target_type: 'request',
      target_id: id,
      new_value: { status: nouveauStatut, raison, rembourse: rembourseEffectue },
      reason: raison,
    })

    // Envoie un email au client pour l'informer de la suppression
    const clientEmail  = (demande.users as any)?.email
    const clientPrenom = (demande.users as any)?.first_name ?? 'Client'
    const appName      = process.env.NEXT_PUBLIC_APP_NAME ?? 'Avisbox'
    const emailContact = process.env.EMAIL_CONTACT ?? process.env.EMAIL_ADMIN!
    const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (clientEmail) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to:   clientEmail,
        subject: `Votre demande a été retirée - ${appName}`,
        html: `
          <p>Bonjour ${clientPrenom},</p>
          <p>Votre demande <strong>"${demande.title}"</strong> a été retirée de la plateforme ${appName} par notre équipe.</p>
          <p><strong>Raison :</strong> ${raison}</p>
          ${rembourseEffectue
            ? `<p>Un remboursement de ${((demande.amount_cents ?? 0) / 100).toFixed(2).replace('.', ',')} € a été effectué sur votre moyen de paiement. Il apparaîtra sous 3 à 5 jours ouvrables.</p>`
            : `<p>Aucun remboursement ne sera effectué pour cette demande.</p>`
          }
          <p>Si vous avez des questions, contactez-nous à <a href="mailto:${emailContact}">${emailContact}</a>.</p>
          <p>L'équipe ${appName}</p>
          <hr />
          <p style="font-size:12px;color:#94a3b8;">
            <a href="${appUrl}/cgu">CGU</a> · <a href="${appUrl}/politique-confidentialite">Confidentialité</a>
          </p>
        `,
      })
    }

    return NextResponse.json({ success: true, rembourse: rembourseEffectue })

  } catch (error) {
    console.error('Erreur DELETE /api/admin/demandes/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
