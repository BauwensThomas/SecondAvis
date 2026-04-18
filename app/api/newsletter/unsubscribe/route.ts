import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/newsletter/unsubscribe?token=xxx - désabonnement via token unique (lien dans les emails)
// Le token est généré automatiquement à l'inscription et jamais exposé publiquement.
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/newsletter/desabonnement?erreur=token', request.url))
    }

    const supabase = createAdminClient()

    // Vérifier que le token correspond à un abonné existant
    const { data: abonne } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('unsubscribe_token', token)
      .single()

    if (!abonne) {
      return NextResponse.redirect(new URL('/newsletter/desabonnement?erreur=introuvable', request.url))
    }

    // Supprimer l'abonné - token valide, opération autorisée
    await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('unsubscribe_token', token)

    return NextResponse.redirect(new URL('/newsletter/desabonnement?confirme=1', request.url))

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
