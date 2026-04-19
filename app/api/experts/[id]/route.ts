import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculerBadges } from '@/lib/utils'

// GET - profil public complet d'un expert avec ses 10 derniers avis
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabaseAdmin = createAdminClient()

    const { data: expert, error } = await supabaseAdmin
      .from('experts')
      .select('id, display_name, photo_url, bio, categories, years_experience, city, languages, availabilities, website_url, entity_type, company_name, average_rating, total_answers, total_signals, created_at, phone, phone_public, address_street, address_zip, address_city, address_public')
      .eq('id', id)
      .eq('is_verified', true)
      .eq('is_blocked', false)
      .single()

    if (error || !expert) {
      return NextResponse.json({ error: 'Expert introuvable.' }, { status: 404 })
    }

    // Calcule le temps de réponse moyen pour le badge "Réponse rapide"
    const { data: reponses } = await supabaseAdmin
      .from('answers')
      .select('delivered_at, requests!inner(created_at)')
      .eq('expert_id', id)
      .not('delivered_at', 'is', null)

    let avg_response_hours: number | undefined
    if (reponses && reponses.length >= 3) {
      const total = reponses.reduce((sum, a) => {
        const req = (a.requests as unknown as { created_at: string })
        const diff = new Date(a.delivered_at!).getTime() - new Date(req.created_at).getTime()
        return sum + diff / (1000 * 60 * 60)
      }, 0)
      avg_response_hours = total / reponses.length
    }

    // Récupère les 10 derniers avis reçus par cet expert
    const { data: avis } = await supabaseAdmin
      .from('ratings')
      .select('score, comment, created_at')
      .eq('expert_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    const badges = calculerBadges({ average_rating: expert.average_rating, total_answers: expert.total_answers, total_signals: expert.total_signals, avg_response_hours })

    return NextResponse.json({ expert, avis: avis ?? [], badges })

  } catch (error) {
    console.error('Erreur inattendue GET /api/experts/[id]:', error)
    return NextResponse.json({ error: "Une erreur inattendue s'est produite." }, { status: 500 })
  }
}
