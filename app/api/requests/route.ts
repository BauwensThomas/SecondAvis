import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { CATEGORY_PRICES, isAdmin } from '@/lib/config'
import { z } from 'zod'

const createRequestSchema = z.object({
  category: z.enum(['mecanique', 'immo', 'travaux', 'assurance', 'travail', 'comptabilite']),
  title: z.string().min(5, 'Le titre doit faire au moins 5 caractères').max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z.string().min(20, 'La description doit faire au moins 20 caractères'),
})

// Calcule la date d'expiration selon la règle vendredi (pas de weekend)
function calculerExpiration(createdAt: Date): Date {
  const expiration = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
  const jour = expiration.getDay()
  if (jour === 6) expiration.setDate(expiration.getDate() + 2)
  else if (jour === 0) expiration.setDate(expiration.getDate() + 1)
  return expiration
}

// POST - crée une nouvelle demande et un PaymentIntent Stripe
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const body = await request.json()
    const data = createRequestSchema.parse(body)

    // Récupère le prix selon la catégorie (défini dans .env)
    const priceCents = CATEGORY_PRICES[data.category] || 1499
    const supabaseAdmin = createAdminClient()

    // Vérifie qu'il y a au moins 2 experts actifs - sauf pour l'admin (tests)
    if (!isAdmin(user.email)) {
      const { count: nbExperts } = await supabaseAdmin
        .from('experts')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)
        .eq('is_active', true)
        .contains('categories', [data.category])

      if ((nbExperts ?? 0) < 2) {
        return NextResponse.json(
          { error: 'Cette catégorie n\'est pas encore disponible. Pas assez d\'experts actifs.' },
          { status: 503 }
        )
      }
    }

    // Récupère le stripe_customer_id du client pour lier le paiement à son profil Stripe
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    // Crée le PaymentIntent Stripe - le paiement sera confirmé côté client
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceCents,
      currency: 'eur',
      ...(userRow?.stripe_customer_id ? { customer: userRow.stripe_customer_id } : {}),
      metadata: {
        user_id: user.id,
        category: data.category,
      },
    })
    const now = new Date()
    const expiresAt = calculerExpiration(now)

    // Crée la demande en base de données - payment_confirmed passera à true après le paiement
    const { data: newRequest, error: dbError } = await supabaseAdmin
      .from('requests')
      .insert({
        user_id: user.id,
        category: data.category,
        title: data.title,
        description: data.description,
        status: 'pending',
        amount_cents: priceCents,
        stripe_payment_intent_id: paymentIntent.id,
        expires_at: expiresAt.toISOString(),
        payment_confirmed: false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erreur insert requests:', dbError)
      return NextResponse.json({ error: 'Erreur lors de la création de la demande.' }, { status: 500 })
    }

    return NextResponse.json({
      request: newRequest,
      client_secret: paymentIntent.client_secret,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Erreur inattendue POST /api/requests:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}

// GET - retourne toutes les demandes de l'utilisateur connecté
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Affiche uniquement les demandes dont le paiement a été confirmé
    const { data: requests, error } = await supabaseAdmin
      .from('requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('payment_confirmed', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des demandes.' }, { status: 500 })
    }

    return NextResponse.json({ requests })

  } catch (error) {
    console.error('Erreur inattendue GET /api/requests:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
