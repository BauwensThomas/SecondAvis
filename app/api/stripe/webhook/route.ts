import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import NewRequest from '@/emails/NewRequest'
import { render } from '@react-email/render'
import React from 'react'

// Désactive le parsing automatique du body - Stripe a besoin du raw body pour vérifier la signature
export const config = { api: { bodyParser: false } }

const CATEGORY_LABELS: Record<string, string> = {
  mecanique: 'Mécanique', immo: 'Immobilier', travaux: 'Travaux',
  assurance: 'Assurance', travail: 'Droit travail', comptabilite: 'Comptabilité',
}

// POST /api/stripe/webhook - reçoit les événements Stripe et confirme les paiements
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 })
  }

  let event
  try {
    // Vérifie que l'événement vient bien de Stripe et non d'un tiers
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  // Paiement confirmé - on active la demande et on notifie les experts
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object

    // Récupère la demande liée à ce paiement
    const { data: demande } = await supabaseAdmin
      .from('requests')
      .select('id, category, title, expires_at, user_id')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single()

    if (!demande) {
      console.error('Demande introuvable pour PaymentIntent:', paymentIntent.id)
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }

    // Active la demande - elle devient visible pour les experts
    await supabaseAdmin
      .from('requests')
      .update({ payment_confirmed: true })
      .eq('id', demande.id)

    // Récupère tous les experts actifs et vérifiés dans cette catégorie
    const { data: experts } = await supabaseAdmin
      .from('experts')
      .select('first_name, email, categories')
      .eq('is_verified', true)
      .eq('is_active', true)
      .contains('categories', [demande.category])

    if (experts && experts.length > 0) {
      const expiresAt = new Date(demande.expires_at).toLocaleString('fr-BE', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      const categorieLabel = CATEGORY_LABELS[demande.category] ?? demande.category

      // Envoie un email à chaque expert de la catégorie
      await Promise.all(experts.map((expert) =>
        resend.emails.send({
          from:    process.env.EMAIL_FROM!,
          to:      expert.email,
          subject: `Nouvelle demande ${categorieLabel} - Avisbox`,
          react:   React.createElement(NewRequest, {
            prenomExpert:  expert.first_name,
            categorie:     categorieLabel,
            titreQuestion: demande.title,
            demandeId:     demande.id,
            expiresAt,
          }),
        })
      ))
    }
  }

  // Paiement échoué - on supprime la demande (le client devra recommencer)
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object
    await supabaseAdmin
      .from('requests')
      .delete()
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .eq('payment_confirmed', false)
  }

  return NextResponse.json({ received: true })
}
