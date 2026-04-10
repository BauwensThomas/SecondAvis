import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET - retourne le profil complet de l'expert connecté pour pré-remplir le formulaire
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: expert, error } = await supabaseAdmin
      .from('experts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Retourne { expert: null } au lieu de 404 pour éviter les erreurs dans les logs
    // (utilisé par ExpertGuard pour détecter si l'admin a un compte expert)
    if (error || !expert) {
      return NextResponse.json({ expert: null })
    }

    return NextResponse.json({ expert })

  } catch (error) {
    console.error('Erreur inattendue GET /api/expert/profile-data:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
