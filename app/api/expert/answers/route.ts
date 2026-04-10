import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET - retourne l'historique de toutes les réponses de l'expert connecté
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: expert } = await supabaseAdmin
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!expert) {
      return NextResponse.json({ error: 'Profil expert introuvable.' }, { status: 404 })
    }

    // Récupère les réponses avec la demande associée et la note reçue
    const { data: answers, error } = await supabaseAdmin
      .from('answers')
      .select(`
        id, content, verdict, delivered_at, is_contested, is_paid,
        contest_decision, contest_resolved, payment_eligible_at,
        requests(id, category, title, status),
        ratings(score, comment)
      `)
      .eq('expert_id', expert.id)
      .order('delivered_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des réponses.' }, { status: 500 })
    }

    return NextResponse.json({ answers: answers ?? [] })

  } catch (error) {
    console.error('Erreur inattendue GET /api/expert/answers:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
