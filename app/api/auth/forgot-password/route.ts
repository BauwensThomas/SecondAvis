import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  email: z.email('Email invalide'),
})

const MAX_TENTATIVES = 3
const FENETRE_MINUTES = 15

// Retourne l'IP du client depuis les headers Vercel / proxy
function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'inconnue'
  )
}

// Envoie un email de reinitialisation de mot de passe
// Limite a 3 demandes par email toutes les 15 minutes pour eviter l'abus
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const supabaseAdmin = createAdminClient()
    const depuis = new Date(Date.now() - FENETRE_MINUTES * 60 * 1000).toISOString()

    // Verifie le nombre de demandes recentes pour cet email
    const cle = `forgot:${data.email.toLowerCase()}`
    const { count: tentativesRecentes } = await supabaseAdmin
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', cle)
      .eq('success', false)
      .gte('created_at', depuis)

    if ((tentativesRecentes ?? 0) >= MAX_TENTATIVES) {
      // Retourne succes pour ne pas reveler si l'email existe ou non
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Enregistre la tentative avant d'envoyer
    await supabaseAdmin.from('login_attempts').insert({
      email:      cle,
      ip_address: getIp(request),
      success:    false,
    })

    const supabase = await createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })

    // Retourne toujours succes meme si l'email n'existe pas (securite - evite l'enumeration)
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
