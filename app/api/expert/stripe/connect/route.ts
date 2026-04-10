import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// POST - crée un compte Stripe Connect Express pour l'expert et retourne l'URL d'onboarding
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id, stripe_account_id, email, entity_type, first_name, last_name, company_name')
      .eq('user_id', user.id)
      .single()

    if (!expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    let stripeAccountId = expert.stripe_account_id

    // Crée un compte Connect Express si l'expert n'en a pas encore
    if (!stripeAccountId) {
      const isCompany = expert.entity_type === 'company'

      const account = await stripe.accounts.create({
        type:          'express',
        country:       'BE',
        email:         expert.email,
        business_type: isCompany ? 'company' : 'individual',
        ...(isCompany && expert.company_name
          ? { company: { name: expert.company_name } }
          : { individual: { first_name: expert.first_name, last_name: expert.last_name } }
        ),
      })

      stripeAccountId = account.id

      await supabaseAdmin
        .from('experts')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', expert.id)
    }

    // Vérifie si l'onboarding est complété
    const account = await stripe.accounts.retrieve(stripeAccountId)

    let url: string

    if (account.details_submitted) {
      // Compte configuré → lien vers le dashboard Stripe Express de l'expert
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId)
      url = loginLink.url
    } else {
      // Onboarding non terminé → reprendre l'onboarding
      const accountLink = await stripe.accountLinks.create({
        account:     stripeAccountId,
        refresh_url: `${appUrl}/expert/gains?stripe=refresh`,
        return_url:  `${appUrl}/expert/gains?stripe=success`,
        type:        'account_onboarding',
      })
      url = accountLink.url
    }

    return NextResponse.json({ url })

  } catch (error) {
    console.error('Erreur inattendue POST /api/expert/stripe/connect:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}

// GET - vérifie si le compte Stripe Connect de l'expert est complet
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (!expert?.stripe_account_id) {
      return NextResponse.json({ connected: false })
    }

    // Vérifie le statut du compte auprès de Stripe
    const account = await stripe.accounts.retrieve(expert.stripe_account_id)
    const connected = account.details_submitted && !account.requirements?.currently_due?.length

    return NextResponse.json({ connected, stripe_account_id: expert.stripe_account_id })

  } catch (error) {
    console.error('Erreur inattendue GET /api/expert/stripe/connect:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
