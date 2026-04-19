import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// POST /api/push/subscribe - enregistre ou met à jour l'abonnement push d'un utilisateur connecté
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const { endpoint, keys } = await request.json()

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Abonnement invalide.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Upsert sur l'endpoint : un même navigateur ne crée qu'un seul abonnement
    await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'endpoint' }
      )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur POST /api/push/subscribe:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
