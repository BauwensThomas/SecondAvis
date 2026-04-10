import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Route appelee par Supabase apres clic sur le lien de confirmation email
// Echange le token contre une session et redirige vers l accueil
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as 'email' | 'recovery' | 'email_change',
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // En cas d erreur, redirige vers la page de confirmation avec message d erreur
  return NextResponse.redirect(new URL('/auth/confirm?error=invalid_token', request.url))
}
