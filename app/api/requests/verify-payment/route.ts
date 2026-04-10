import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { render } from '@react-email/components'
import NewRequest from '@/emails/NewRequest'
import ReceiptClient from '@/emails/ReceiptClient'

const CATEGORY_LABELS: Record<string, string> = {
  mecanique:    'Mécanique automobile',
  immo:         'Immobilier',
  travaux:      'Travaux',
  assurance:    'Assurance',
  travail:      'Droit du travail',
  comptabilite: 'Comptabilité',
}

// GET - vérifie le statut d'un paiement et confirme la demande si le paiement a réussi
// Appelé avec ?pi_id=pi_xxx (PaymentIntent ID)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const piId = request.nextUrl.searchParams.get('pi_id')
    if (!piId) {
      return NextResponse.json({ error: 'Paramètre pi_id manquant.' }, { status: 400 })
    }

    // Récupère le statut du PaymentIntent depuis Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(piId)

    // Vérifie que ce PaymentIntent appartient bien à cet utilisateur
    if (paymentIntent.metadata.user_id !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 })
    }

    // Si le paiement est confirmé, on marque la demande comme active
    if (paymentIntent.status === 'succeeded') {
      const supabaseAdmin = createAdminClient()

      // Récupère la demande et les infos client pour les notifications et le reçu
      const { data: req } = await supabaseAdmin
        .from('requests')
        .select('id, title, category, expires_at, payment_confirmed, amount_cents, created_at, users(email, first_name)')
        .eq('stripe_payment_intent_id', piId)
        .eq('user_id', user.id)
        .single()

      await supabaseAdmin
        .from('requests')
        .update({ payment_confirmed: true })
        .eq('stripe_payment_intent_id', piId)
        .eq('user_id', user.id)

      // Envoie le reçu et notifie les experts seulement si la demande vient juste d'être confirmée
      if (req && !req.payment_confirmed) {
        const clientUser = req.users as unknown as { email: string; first_name: string } | null

        // Envoie le reçu au client
        if (clientUser?.email) {
          const montant   = ((req.amount_cents ?? 900) / 100).toFixed(2).replace('.', ',') + ' €'
          const dateStr   = new Date(req.created_at).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
          const annee     = new Date(req.created_at).getFullYear()
          const shortId   = req.id.slice(0, 8).toUpperCase()
          const receiptNb = `SA-${annee}-${shortId}`

          const html = await render(ReceiptClient({
            prenomClient:    clientUser.first_name,
            receiptNumber:   receiptNb,
            titreQuestion:   req.title,
            categorie:       CATEGORY_LABELS[req.category] ?? req.category,
            montant,
            datePaiement:    dateStr,
            stripePaymentId: piId,
          }))
          await resend.emails.send({
            from:    EMAIL_FROM,
            to:      clientUser.email,
            subject: `Votre reçu SecondAvis - ${receiptNb}`,
            html,
          })
        }

        const { data: experts } = await supabaseAdmin
          .from('experts')
          .select('email, first_name')
          .eq('is_active', true)
          .eq('is_verified', true)
          .eq('is_blocked', false)
          .contains('categories', [req.category])

        if (experts && experts.length > 0) {
          const expiration = new Date(req.expires_at).toLocaleDateString('fr-BE', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })
          const categorieLabel = CATEGORY_LABELS[req.category] ?? req.category

          await Promise.allSettled(
            experts.map(async (expert) => {
              const html = await render(NewRequest({
                prenomExpert: expert.first_name,
                categorie:    categorieLabel,
                titreQuestion: req.title,
                demandeId:    req.id,
                expiresAt:    expiration,
              }))
              return resend.emails.send({
                from:    EMAIL_FROM,
                to:      expert.email,
                subject: `Nouvelle demande - ${categorieLabel} - SecondAvis`,
                html,
              })
            })
          )
        }
      }
    }

    return NextResponse.json({ status: paymentIntent.status })

  } catch (error) {
    console.error('Erreur inattendue GET /api/requests/verify-payment:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
