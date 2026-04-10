import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/config'

// Retourne l'utilisateur connecté avec son rôle (user | expert | admin)
export async function GET() {
  try {
    const supabase = await createClient()

    // Récupère la session courante depuis les cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère toujours le profil depuis la table users (contient first_name, last_name, etc.)
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone, marketing_emails, is_blocked')
      .eq('id', user.id)
      .single()

    // Vérifie si c'est l'admin
    if (isAdmin(user.email)) {
      return NextResponse.json({ user: userProfile ?? user, role: 'admin' })
    }

    // Vérifie si c'est un expert
    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id, is_active, is_verified')
      .eq('user_id', user.id)
      .single()

    if (expert) {
      return NextResponse.json({ user: userProfile ?? user, role: 'expert', expert })
    }

    // Client classique
    return NextResponse.json({ user: userProfile ?? user, role: 'user' })

  } catch (error) {
    console.error('Erreur inattendue /api/auth/me:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
