import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const LOCK_DURATION_MINUTES = 10

// POST - verrouille une demande pour l'expert courant pendant 10 minutes
// Si la demande est déjà verrouillée par un autre expert, retourne une erreur
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère le profil expert
    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id, is_active, is_verified')
      .eq('user_id', user.id)
      .single()

    if (!expert?.is_active || !expert?.is_verified) {
      return NextResponse.json({ error: 'Compte expert inactif.' }, { status: 403 })
    }

    // Récupère la demande avec son verrou actuel
    const { data: request } = await supabaseAdmin
      .from('requests')
      .select('id, status, locked_by, locked_at')
      .eq('id', id)
      .single()

    if (!request || request.status !== 'pending') {
      return NextResponse.json({ error: 'Cette demande n\'est plus disponible.' }, { status: 409 })
    }

    const now = new Date()
    const lockExpiry = LOCK_DURATION_MINUTES * 60 * 1000

    // Vérifie si la demande est verrouillée par un autre expert (verrou non expiré)
    if (
      request.locked_by &&
      request.locked_by !== expert.id &&
      request.locked_at &&
      new Date(request.locked_at).getTime() + lockExpiry > now.getTime()
    ) {
      const minutesRestantes = Math.ceil(
        (new Date(request.locked_at).getTime() + lockExpiry - now.getTime()) / 60000
      )
      return NextResponse.json(
        { error: `Cette demande est en cours de traitement par un autre expert. Réessayez dans ${minutesRestantes} minute(s).` },
        { status: 409 }
      )
    }

    // Pose le verrou pour cet expert
    await supabaseAdmin
      .from('requests')
      .update({ locked_by: expert.id, locked_at: now.toISOString() })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      expires_at: new Date(now.getTime() + lockExpiry).toISOString(),
    })

  } catch (error) {
    console.error('Erreur inattendue POST /api/expert/requests/[id]/lock:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}

// DELETE - libère le verrou (si l'expert quitte la page sans répondre)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const supabaseAdmin = createAdminClient()

    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!expert) return NextResponse.json({ error: 'Expert introuvable.' }, { status: 404 })

    // Libère uniquement si c'est bien cet expert qui a posé le verrou
    await supabaseAdmin
      .from('requests')
      .update({ locked_by: null, locked_at: null })
      .eq('id', id)
      .eq('locked_by', expert.id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur inattendue DELETE /api/expert/requests/[id]/lock:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
