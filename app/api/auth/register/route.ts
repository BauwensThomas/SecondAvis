import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

// Schéma de validation pour l'inscription
const registerSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  first_name: z.string().min(1, 'Le prénom est obligatoire'),
  last_name: z.string().min(1, 'Le nom est obligatoire'),
  phone: z.string().optional(),
  is_adult_confirmed: z.boolean().refine((val) => val === true, {
    message: 'Vous devez confirmer avoir 18 ans ou plus',
  }),
  marketing_emails: z.boolean().optional().default(false),
})

const MAX_INSCRIPTIONS_PAR_IP = 5
const FENETRE_INSCRIPTION_MINUTES = 60

// Retourne l'IP du client depuis les headers Vercel / proxy
function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'inconnue'
  )
}

// Crée un nouveau compte client (utilisateur)
// Limite a 5 inscriptions par IP par heure pour bloquer les creations en masse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Client admin pour bypasser RLS lors de la vérification et de l'insertion
    const supabaseAdmin = createAdminClient()
    const supabase = await createClient()

    // Verifie le nombre d'inscriptions recentes depuis cette IP
    const ip = getIp(request)
    const cle = `register:${ip}`
    const depuis = new Date(Date.now() - FENETRE_INSCRIPTION_MINUTES * 60 * 1000).toISOString()
    const { count: inscriptionsRecentes } = await supabaseAdmin
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', cle)
      .eq('success', false)
      .gte('created_at', depuis)

    if ((inscriptionsRecentes ?? 0) >= MAX_INSCRIPTIONS_PAR_IP) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans une heure.' },
        { status: 429 }
      )
    }

    // Enregistre la tentative
    await supabaseAdmin.from('login_attempts').insert({
      email:      cle,
      ip_address: ip,
      success:    false,
    })

    // Vérifie que l'email n'existe pas déjà dans la table users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email.' },
        { status: 409 }
      )
    }

    // Crée le compte dans Supabase Auth - envoie automatiquement l'email de confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (authError || !authData.user) {
      console.error('Supabase signUp error:', authError)
      // Traduit les messages d'erreur Supabase en français
      let message = 'Erreur lors de la création du compte.'
      if (authError?.message?.includes('rate limit')) {
        message = 'Trop de tentatives. Attendez quelques minutes avant de réessayer.'
      } else if (authError?.message?.includes('already registered')) {
        message = 'Un compte existe déjà avec cet email.'
      }
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Crée un client Stripe pour pouvoir lier ses paiements futurs
    let stripeCustomerId: string | null = null
    try {
      const customer = await stripe.customers.create({
        email: data.email,
        name: `${data.first_name} ${data.last_name}`,
        metadata: { user_id: authData.user.id },
      })
      stripeCustomerId = customer.id
    } catch (stripeErr) {
      console.error('Erreur création client Stripe:', stripeErr)
    }

    // Récupère l'IP de la requête pour la conserver (conformité RGPD)
    const registrationIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? null

    // Crée la ligne dans la table users - utilise le client admin pour bypasser RLS
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone ?? null,
      is_adult_confirmed: data.is_adult_confirmed,
      marketing_emails: data.marketing_emails ?? false,
      stripe_customer_id: stripeCustomerId,
      registration_ip: registrationIp,
    })

    if (dbError) {
      console.error('Erreur insert users:', dbError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde du profil.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Compte créé. Vérifiez votre email pour confirmer votre inscription.' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error('Erreur inattendue register:', error)
    return NextResponse.json(
      { error: "Une erreur inattendue s'est produite." },
      { status: 500 }
    )
  }
}
