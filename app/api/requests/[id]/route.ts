import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET - retourne le détail d'une demande avec sa réponse si elle existe
export async function GET(
  _request: NextRequest,
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

    // Récupère la demande en vérifiant que l'utilisateur en est bien le propriétaire
    const { data: req, error: reqError } = await supabaseAdmin
      .from('requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (reqError || !req) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }

    // Récupère la réponse associée si elle existe
    const { data: answer } = await supabaseAdmin
      .from('answers')
      .select('*, experts(id, display_name, photo_url, city, average_rating, total_answers)')
      .eq('request_id', id)
      .single()

    // Récupère la note déjà soumise par cet utilisateur pour cette réponse
    let rating = null
    if (answer) {
      const { data: userRow } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (userRow) {
        const { data: existante } = await supabaseAdmin
          .from('ratings')
          .select('score, comment')
          .eq('answer_id', answer.id)
          .eq('user_id', userRow.id)
          .single()
        rating = existante ?? null
      }
    }

    return NextResponse.json({ request: req, answer: answer ?? null, rating })

  } catch (error) {
    console.error('Erreur inattendue GET /api/requests/[id]:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}

// DELETE - supprime une demande non confirmée (paiement échoué)
export async function DELETE(
  _request: NextRequest,
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

    // Supprime uniquement si la demande appartient à l'utilisateur ET que le paiement n'est pas confirmé
    // Empêche de supprimer une demande déjà payée
    const { error } = await supabaseAdmin
      .from('requests')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('payment_confirmed', false)

    if (error) {
      return NextResponse.json({ error: 'Impossible de supprimer cette demande.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erreur inattendue DELETE /api/requests/[id]:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
