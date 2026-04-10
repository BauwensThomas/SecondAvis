import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const MAX_TENTATIVES = 3
const FENETRE_MINUTES = 15

const loginSchema = z.object({
  email:    z.email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est obligatoire'),
})

// Retourne l'IP du client depuis les headers Vercel / proxy
function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'inconnue'
  )
}

// Connecte un utilisateur - bloque après 3 échecs en 15 minutes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = loginSchema.parse(body)

    const supabaseAdmin = createAdminClient()
    const ip = getIp(request)
    const depuis = new Date(Date.now() - FENETRE_MINUTES * 60 * 1000).toISOString()

    // Compte les échecs récents pour cet email
    const { count: echecsRecents } = await supabaseAdmin
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', data.email.toLowerCase())
      .eq('success', false)
      .gte('created_at', depuis)

    if ((echecsRecents ?? 0) >= MAX_TENTATIVES) {
      return NextResponse.json(
        { error: `Trop de tentatives échouées. Réessayez dans ${FENETRE_MINUTES} minutes ou réinitialisez votre mot de passe.`, bloque: true },
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    })

    if (error) {
      // Enregistre l'échec
      await supabaseAdmin.from('login_attempts').insert({
        email:      data.email.toLowerCase(),
        ip_address: ip,
        success:    false,
      })

      const echecsApres = (echecsRecents ?? 0) + 1
      const restants = MAX_TENTATIVES - echecsApres

      const message = restants <= 0
        ? `Compte temporairement bloqué. Réessayez dans ${FENETRE_MINUTES} minutes ou réinitialisez votre mot de passe.`
        : `Email ou mot de passe incorrect. ${restants} tentative${restants > 1 ? 's' : ''} restante${restants > 1 ? 's' : ''} avant blocage temporaire.`

      return NextResponse.json(
        { error: message, bloque: restants <= 0 },
        { status: 401 }
      )
    }

    // Succès - enregistre la réussite (optionnel, pour l'audit)
    await supabaseAdmin.from('login_attempts').insert({
      email:      data.email.toLowerCase(),
      ip_address: ip,
      success:    true,
    })

    return NextResponse.json({ user: authData.user }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
