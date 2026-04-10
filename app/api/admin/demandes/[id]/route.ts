import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/config'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET /api/admin/demandes/[id] - détail complet d'une demande (admin)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    // Récupère la demande avec le client associé
    const { data: request, error } = await supabaseAdmin
      .from('requests')
      .select('*, users(id, first_name, last_name, email, phone)')
      .eq('id', id)
      .single()

    if (error || !request) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 })
    }

    // Récupère la réponse si elle existe, avec l'expert
    const { data: answer } = await supabaseAdmin
      .from('answers')
      .select('*, experts(id, display_name, email, average_rating, total_answers)')
      .eq('request_id', id)
      .maybeSingle()

    // Récupère la note si elle existe
    const { data: rating } = answer?.id
      ? await supabaseAdmin.from('ratings').select('score, comment, created_at').eq('answer_id', answer.id).maybeSingle()
      : { data: null }

    return NextResponse.json({ request, answer: answer ?? null, rating: rating ?? null })

  } catch (error) {
    console.error('Erreur GET /api/admin/demandes/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
